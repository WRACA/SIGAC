# Despliegue de SIGAC en AWS (una sola instancia EC2)

URL pública: **https://sigac.duckdns.org**

## Arquitectura

```
Navegador ──HTTPS──▶ Caddy (:443, certificado Let's Encrypt automático)
                       ├─ /api/*  ──▶ 127.0.0.1:3000  backend Rust (systemd: sigac-backend), prefijo /api intacto
                       └─ resto   ──▶ /srv/sigac      frontend (SPA, try_files → index.html)
backend ──TLS──▶ Neon PostgreSQL (us-east-2)
```

| Recurso | Valor |
|---|---|
| Región | us-east-2 |
| Instancia | `i-09a5d2f22f2a2856b` — t3.small, Ubuntu 24.04, gp3 20 GB, swap 2 GB |
| Elastic IP | `13.59.213.187` (`eipalloc-0c367904b4398e608`) |
| Security group | `sg-0211fa073945e22a2` (`sigac-sg`): 80/443 abiertos, 22 solo a tu IP |
| Key pair | `sigac-aws` → `$HOME\.ssh\sigac-aws.pem` |
| DNS | `sigac.duckdns.org` → 13.59.213.187 (DuckDNS, manual) |

Todos los recursos AWS llevan la etiqueta `Project=SIGAC`.

En la instancia:

| Ruta | Qué es |
|---|---|
| `/opt/sigac/backend-sigac` | binario del backend |
| `/srv/sigac/` | frontend compilado (`dist`) |
| `/etc/sigac/sigac.env` | `DB_URL_AUTH`, `DB_URL_API`, `DB_URL_PUBLIC`, `JWT_SECRET` (600, dueño `sigac`) |
| `/etc/caddy/Caddyfile` | generado desde `deploy/Caddyfile` |
| `/etc/systemd/system/sigac-backend.service` | copia de `deploy/sigac-backend.service` |

Caddy y `sigac-backend` están habilitados: al prender la instancia todo vuelve solo.

## Configuración local (una vez)

```powershell
Copy-Item deploy\.env.local.example deploy\.env.local   # ignorado por git; ajusta si cambia algo
```

## Redesplegar

```powershell
.\deploy\permitir-mi-ip.ps1     # si tu IP pública cambió desde la última vez
.\deploy\deploy.ps1             # despliega HEAD (solo lo commiteado del backend)
.\deploy\deploy.ps1 -Ref origin/main
```

El script compila el frontend en una carpeta temporal (no toca `frontend/dist`), empaqueta `backend/` con `git archive`, lo sube por scp, compila en la instancia (`CARGO_BUILD_JOBS=2`, compilación incremental en `~/sigac-target`), reinicia el servicio, recarga Caddy y verifica `GET /api/actividades`.
`/etc/sigac/sigac.env` solo se crea en el primer despliegue (con un `JWT_SECRET` nuevo); los siguientes no lo tocan. Para regenerarlo: bórralo en la instancia (`sudo rm /etc/sigac/sigac.env`) y vuelve a desplegar (las sesiones abiertas se invalidan).

## Ver logs / entrar a la instancia

```powershell
ssh -i $HOME\.ssh\sigac-aws.pem ubuntu@13.59.213.187
sudo journalctl -u sigac-backend -f          # backend
sudo journalctl -u caddy -f                  # Caddy / certificados
sudo systemctl status sigac-backend caddy
```

## Apagar y prender bajo demanda

```powershell
aws ec2 stop-instances  --region us-east-2 --instance-ids i-09a5d2f22f2a2856b
aws ec2 start-instances --region us-east-2 --instance-ids i-09a5d2f22f2a2856b
aws ec2 describe-instances --region us-east-2 --instance-ids i-09a5d2f22f2a2856b --query "Reservations[0].Instances[0].State.Name" --output text
```

Con la Elastic IP conservada la IP y la URL no cambian; al prender, Caddy y el backend arrancan solos (~1 min).

**Costos aproximados (us-east-2):**

| Estado | Concepto | Costo |
|---|---|---|
| Prendida | t3.small $0.0208/h + IPv4 $0.005/h + gp3 20 GB | ≈ $0.62/día ≈ **$4.70/semana** (~$20/mes) |
| Apagada | gp3 20 GB ($1.60/mes) + Elastic IP ($0.005/h ≈ $3.65/mes) | ≈ **$5.25/mes** |
| Apagada sin EIP | solo gp3 20 GB | ≈ **$1.60/mes** |

**Alternativa más barata apagada:** liberar la Elastic IP y, al prender, actualizar DuckDNS con la IP nueva:

```powershell
# liberar (con la instancia ya apagada)
aws ec2 disassociate-address --region us-east-2 --association-id (aws ec2 describe-addresses --region us-east-2 --allocation-ids eipalloc-0c367904b4398e608 --query "Addresses[0].AssociationId" --output text)
aws ec2 release-address      --region us-east-2 --allocation-id eipalloc-0c367904b4398e608
# al prender: IP pública nueva (efímera)
aws ec2 describe-instances --region us-east-2 --instance-ids i-09a5d2f22f2a2856b --query "Reservations[0].Instances[0].PublicIpAddress" --output text
```

Luego apunta `sigac.duckdns.org` a esa IP en duckdns.org y cambia `SIGAC_HOST` en `deploy/.env.local`. La IP efímera también cuesta $0.005/h, pero solo mientras la instancia está prendida.

## Destruir todo

Solo recursos con `Project=SIGAC`. Verifica primero:

```powershell
aws resourcegroupstaggingapi get-resources --region us-east-2 --tag-filters Key=Project,Values=SIGAC --query "ResourceTagMappingList[].ResourceARN" --output table
```

Después, en este orden:

```powershell
$r = 'us-east-2'
aws ec2 terminate-instances --region $r --instance-ids i-09a5d2f22f2a2856b     # también borra el disco (DeleteOnTermination)
aws ec2 wait instance-terminated --region $r --instance-ids i-09a5d2f22f2a2856b
aws ec2 release-address        --region $r --allocation-id eipalloc-0c367904b4398e608   # se desasocia sola al terminar la instancia
aws ec2 delete-security-group  --region $r --group-id sg-0211fa073945e22a2
aws ec2 delete-key-pair        --region $r --key-name sigac-aws
Remove-Item $HOME\.ssh\sigac-aws.pem -Force
```

Por último, borra el subdominio en duckdns.org.
