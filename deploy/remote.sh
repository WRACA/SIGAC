#!/usr/bin/env bash
# Parte remota del despliegue de SIGAC (la invoca deploy/deploy.ps1). Idempotente.
#   bash remote.sh <dominio>
# Espera en /tmp/sigac-deploy: backend.tar.gz, frontend.tar.gz, Caddyfile,
# sigac-backend.service, bootstrap.sh y, solo en el primer despliegue, db.env
# (las URL de Neon por rol; se borra al terminar).
set -euo pipefail
DOMINIO="${1:?Uso: remote.sh <dominio>}"
STAGE=/tmp/sigac-deploy
SRC="$HOME/sigac-src"
export CARGO_TARGET_DIR="$HOME/sigac-target"   # se conserva entre despliegues (compilación incremental)
export CARGO_BUILD_JOBS=2                      # no agotar la RAM de la t3.small
ENV_FILE=/etc/sigac/sigac.env

# 0. Dependencias (solo hace algo la primera vez)
if ! command -v caddy >/dev/null || [ ! -x "$HOME/.cargo/bin/cargo" ] || ! id sigac >/dev/null 2>&1; then
  bash "$STAGE/bootstrap.sh"
fi

# 1. Archivo de entorno (solo si no existe: así el JWT_SECRET no cambia en cada despliegue)
if ! sudo test -f "$ENV_FILE"; then
  [ -s "$STAGE/db.env" ] || { echo "ERROR: falta $ENV_FILE y no se recibió db.env" >&2; exit 1; }
  umask 077
  tmp="$(mktemp)"
  for clave in DB_URL_AUTH DB_URL_API DB_URL_PUBLIC; do
    valor="$(grep -E "^[[:space:]]*${clave}[[:space:]]*=" "$STAGE/db.env" | tail -n1 | sed -E 's/^[^=]*=[[:space:]]*//; s/^"(.*)"[[:space:]]*$/\1/; s/^'"'"'(.*)'"'"'[[:space:]]*$/\1/' | tr -d '\r')"
    [ -n "$valor" ] || { echo "ERROR: db.env no trae $clave" >&2; rm -f "$tmp"; exit 1; }
    # Neon exige TLS: asegurar sslmode=require
    if ! grep -q 'sslmode=' <<<"$valor"; then
      if grep -q '?' <<<"$valor"; then valor="${valor}&sslmode=require"; else valor="${valor}?sslmode=require"; fi
    fi
    printf '%s="%s"\n' "$clave" "$valor" >> "$tmp"
  done
  printf 'JWT_SECRET="%s"\n' "$(openssl rand -hex 32)" >> "$tmp"
  sudo install -m 600 -o sigac -g sigac "$tmp" "$ENV_FILE"
  rm -f "$tmp"
  echo "Creado $ENV_FILE (JWT_SECRET nuevo)"
fi
rm -f "$STAGE/db.env"

# 2. Compilar el backend
rm -rf "$SRC" && mkdir -p "$SRC"
tar -xzf "$STAGE/backend.tar.gz" -C "$SRC"
( cd "$SRC/backend" && "$HOME/.cargo/bin/cargo" build --release --locked )
sudo install -m 755 -o root -g root "$CARGO_TARGET_DIR/release/backend-sigac" /opt/sigac/backend-sigac.new
sudo mv -f /opt/sigac/backend-sigac.new /opt/sigac/backend-sigac

# 3. Frontend (reemplazo atómico de /srv/sigac)
sudo rm -rf /srv/sigac.new /srv/sigac.old
sudo mkdir -p /srv/sigac.new
sudo tar -xzf "$STAGE/frontend.tar.gz" -C /srv/sigac.new --no-same-owner
sudo chmod -R a+rX /srv/sigac.new
[ -d /srv/sigac ] && sudo mv /srv/sigac /srv/sigac.old
sudo mv /srv/sigac.new /srv/sigac
sudo rm -rf /srv/sigac.old

# 4. systemd
sudo install -m 644 "$STAGE/sigac-backend.service" /etc/systemd/system/sigac-backend.service
sudo systemctl daemon-reload
sudo systemctl enable sigac-backend >/dev/null 2>&1
sudo systemctl restart sigac-backend

# 5. Caddy
sed "s/__DOMINIO__/${DOMINIO}/g" "$STAGE/Caddyfile" | sudo tee /etc/caddy/Caddyfile >/dev/null
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null
sudo systemctl enable caddy >/dev/null 2>&1
if systemctl is-active --quiet caddy; then sudo systemctl reload caddy; else sudo systemctl restart caddy; fi

# 6. Verificación local
for i in $(seq 1 30); do
  codigo="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/api/actividades || true)"
  [ "$codigo" = "200" ] && { echo "Backend OK (GET /api/actividades -> 200)"; break; }
  sleep 2
done
if [ "$codigo" != "200" ]; then
  echo "ERROR: el backend no respondió 200 (último código: $codigo)" >&2
  sudo journalctl -u sigac-backend -n 40 --no-pager >&2
  exit 1
fi
echo DEPLOY_OK
