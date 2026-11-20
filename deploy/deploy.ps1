<#
.SYNOPSIS
  Despliega SIGAC en la instancia EC2 (idempotente).

.DESCRIPTION
  1. Compila el frontend en una carpeta temporal (no toca frontend/dist del repo).
  2. Empaqueta backend/ con `git archive` desde -Ref (por defecto HEAD: solo lo commiteado).
  3. Sube todo por scp y ejecuta deploy/remote.sh en la instancia, que compila el
     backend con cargo, instala binario + frontend + Caddy + systemd y verifica.
  En el primer despliegue (si /etc/sigac/sigac.env no existe) envía las URL de Neon
  de backend/.env por stdin (nunca por línea de comandos ni en pantalla); la instancia
  genera un JWT_SECRET nuevo.

  Host, llave y dominio salen de deploy/.env.local (ignorado por git), ver
  deploy/.env.local.example.

.EXAMPLE
  .\deploy\deploy.ps1
  .\deploy\deploy.ps1 -Ref origin/main
#>
param(
    [string]$Ref = 'HEAD'
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot

function Read-DeployConfig {
    $archivo = Join-Path $PSScriptRoot '.env.local'
    if (-not (Test-Path $archivo)) { throw "Falta $archivo (copia deploy/.env.local.example)" }
    $cfg = @{}
    foreach ($linea in Get-Content $archivo) {
        if ($linea -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"]*)"?\s*$') { $cfg[$matches[1]] = $matches[2] }
    }
    foreach ($k in 'SIGAC_HOST', 'SIGAC_KEY', 'SIGAC_DOMAIN') {
        if (-not $cfg[$k]) { throw "deploy/.env.local no define $k" }
    }
    $cfg.SIGAC_KEY = $cfg.SIGAC_KEY -replace '^~', $HOME -replace '\$HOME', $HOME
    return $cfg
}

function Invoke-Checked([string]$what, [scriptblock]$block) {
    & $block
    if ($LASTEXITCODE -ne 0) { throw "$what falló (código $LASTEXITCODE)" }
}

$cfg = Read-DeployConfig
$destino = "ubuntu@$($cfg.SIGAC_HOST)"
$sshOpts = @('-i', $cfg.SIGAC_KEY, '-o', 'StrictHostKeyChecking=accept-new', '-o', 'ConnectTimeout=20')

$tmp = Join-Path ([IO.Path]::GetTempPath()) ("sigac-deploy-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
    $commit = git -C $repo rev-parse --short $Ref
    if ($LASTEXITCODE -ne 0) { throw "Ref inválida: $Ref" }
    if (git -C $repo status --porcelain) { Write-Warning "Hay cambios sin commitear: el backend se empaqueta desde $Ref ($commit) y NO los incluye; el frontend se compila desde tu árbol de trabajo." }

    Write-Host "==> Frontend: npm ci + build" -ForegroundColor Cyan
    Push-Location (Join-Path $repo 'frontend')
    try {
        Invoke-Checked 'npm ci' { npm ci --no-audit --no-fund }
        Invoke-Checked 'vite build' { npx vite build --outDir (Join-Path $tmp 'dist') --emptyOutDir }
    } finally { Pop-Location }
    Invoke-Checked 'tar frontend' { tar -czf (Join-Path $tmp 'frontend.tar.gz') -C (Join-Path $tmp 'dist') . }

    Write-Host "==> Backend: git archive $Ref ($commit)" -ForegroundColor Cyan
    Invoke-Checked 'git archive' { git -C $repo archive --format=tar.gz -o (Join-Path $tmp 'backend.tar.gz') $Ref backend }

    # Scripts con finales de línea LF (por si git los sacó con CRLF)
    foreach ($f in 'remote.sh', 'bootstrap.sh', 'Caddyfile', 'sigac-backend.service') {
        $txt = (Get-Content (Join-Path $PSScriptRoot $f) -Raw) -replace "`r`n", "`n"
        [IO.File]::WriteAllText((Join-Path $tmp $f), $txt)
    }

    Write-Host "==> Subiendo a $($cfg.SIGAC_HOST)" -ForegroundColor Cyan
    Invoke-Checked 'ssh mkdir' { ssh @sshOpts $destino 'rm -rf /tmp/sigac-deploy && mkdir -p /tmp/sigac-deploy' }
    $archivos = 'backend.tar.gz', 'frontend.tar.gz', 'remote.sh', 'bootstrap.sh', 'Caddyfile', 'sigac-backend.service' | ForEach-Object { Join-Path $tmp $_ }
    Invoke-Checked 'scp' { scp -q @sshOpts @archivos "${destino}:/tmp/sigac-deploy/" }

    # Primer despliegue: mandar las URL de Neon por stdin (sin mostrarlas)
    ssh @sshOpts $destino 'sudo test -f /etc/sigac/sigac.env'
    if ($LASTEXITCODE -ne 0) {
        Write-Host "==> Primer despliegue: enviando URL de Neon desde backend/.env" -ForegroundColor Cyan
        $lineas = Get-Content (Join-Path $repo 'backend/.env') | Where-Object { $_ -match '^\s*(DB_URL_AUTH|DB_URL_API|DB_URL_PUBLIC)\s*=' }
        if (@($lineas).Count -lt 3) { throw 'backend/.env no trae DB_URL_AUTH, DB_URL_API y DB_URL_PUBLIC' }
        ($lineas -join "`n") | ssh @sshOpts $destino 'umask 077 && cat > /tmp/sigac-deploy/db.env'
        if ($LASTEXITCODE -ne 0) { throw 'No se pudo enviar db.env' }
        $lineas = $null
    }

    Write-Host "==> Compilando e instalando en la instancia (puede tardar varios minutos)" -ForegroundColor Cyan
    Invoke-Checked 'remote.sh' { ssh @sshOpts $destino "bash /tmp/sigac-deploy/remote.sh $($cfg.SIGAC_DOMAIN)" }

    Write-Host "==> Verificando https://$($cfg.SIGAC_DOMAIN)" -ForegroundColor Cyan
    $r = Invoke-WebRequest -Uri "https://$($cfg.SIGAC_DOMAIN)/api/actividades" -UseBasicParsing
    Write-Host "GET /api/actividades -> $($r.StatusCode)" -ForegroundColor Green
    Write-Host "Desplegado $commit en https://$($cfg.SIGAC_DOMAIN)" -ForegroundColor Green
}
finally {
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
}
