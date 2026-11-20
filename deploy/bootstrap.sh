#!/usr/bin/env bash
# Prepara una instancia Ubuntu 24.04 limpia para SIGAC (idempotente):
# swap de 2 GB, dependencias de compilación, rustup (instalador oficial),
# Caddy (repo apt oficial) y el usuario de sistema `sigac`.
# Se ejecuta como el usuario `ubuntu` (usa sudo donde hace falta).
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

# Swap (compilar Rust con 2 GB de RAM lo necesita)
if [ ! -f /swapfile ]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab >/dev/null
fi

# Timeout y reintentos: una descarga colgada no debe bloquear el despliegue
echo 'Acquire::http::Timeout "30"; Acquire::https::Timeout "30"; Acquire::Retries "3";' \
  | sudo tee /etc/apt/apt.conf.d/80sigac-timeouts >/dev/null

sudo apt-get update -y
sudo apt-get install -y build-essential pkg-config curl gpg openssl \
  debian-keyring debian-archive-keyring apt-transport-https postgresql-client

# Rust (instalador oficial de rust-lang.org), para el usuario ubuntu
if [ ! -x "$HOME/.cargo/bin/rustup" ]; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain stable
fi
"$HOME/.cargo/bin/rustup" update stable
"$HOME/.cargo/bin/rustc" --version

# Caddy (repo apt oficial)
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --batch --yes --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  sudo chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
  sudo apt-get update -y
  sudo apt-get install -y caddy
fi
caddy version

# Usuario de sistema y directorios
id sigac >/dev/null 2>&1 || sudo useradd --system --no-create-home --shell /usr/sbin/nologin sigac
sudo mkdir -p /opt/sigac /srv/sigac /etc/sigac
echo BOOTSTRAP_OK
