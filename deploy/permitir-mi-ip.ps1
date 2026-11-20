<#
.SYNOPSIS
  Abre el puerto 22 del security group de SIGAC solo a tu IP pública actual
  y quita las IP anteriores que este script haya agregado.

.DESCRIPTION
  Solo toca reglas de SSH (tcp/22) con la descripción "ssh-mi-ip" y solo en un
  security group etiquetado Project=SIGAC. No modifica las reglas 80/443.
  Lee SIGAC_SG_ID y SIGAC_REGION de deploy/.env.local.
#>
$ErrorActionPreference = 'Stop'

$cfg = @{}
foreach ($linea in Get-Content (Join-Path $PSScriptRoot '.env.local')) {
    if ($linea -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"]*)"?\s*$') { $cfg[$matches[1]] = $matches[2] }
}
$sg = $cfg.SIGAC_SG_ID
$region = if ($cfg.SIGAC_REGION) { $cfg.SIGAC_REGION } else { 'us-east-2' }
if (-not $sg) { throw 'deploy/.env.local no define SIGAC_SG_ID' }

$proyecto = aws ec2 describe-security-groups --region $region --group-ids $sg --query "SecurityGroups[0].Tags[?Key=='Project'].Value | [0]" --output text
if ($proyecto -ne 'SIGAC') { throw "El security group $sg no tiene la etiqueta Project=SIGAC; no lo toco." }

$ip = (Invoke-RestMethod -Uri 'https://checkip.amazonaws.com').Trim()
$cidr = "$ip/32"
Write-Host "Tu IP pública: $cidr"

$reglas = aws ec2 describe-security-group-rules --region $region --filters "Name=group-id,Values=$sg" `
    --query "SecurityGroupRules[?!IsEgress && FromPort==``22`` && ToPort==``22`` && Description=='ssh-mi-ip'].[SecurityGroupRuleId,CidrIpv4]" --output json | ConvertFrom-Json

$yaEsta = $false
foreach ($r in $reglas) {
    if ($r[1] -eq $cidr) { $yaEsta = $true; continue }
    Write-Host "Quitando regla anterior $($r[0]) ($($r[1]))"
    aws ec2 revoke-security-group-ingress --region $region --group-id $sg --security-group-rule-ids $r[0] | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'revoke-security-group-ingress falló' }
}

if ($yaEsta) {
    Write-Host "$cidr ya tenía acceso al puerto 22."
} else {
    aws ec2 authorize-security-group-ingress --region $region --group-id $sg `
        --tag-specifications 'ResourceType=security-group-rule,Tags=[{Key=Project,Value=SIGAC}]' `
        --ip-permissions "IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges=[{CidrIp=$cidr,Description=ssh-mi-ip}]" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'authorize-security-group-ingress falló' }
    Write-Host "Puerto 22 abierto solo para $cidr."
}
