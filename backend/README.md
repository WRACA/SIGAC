# Backend SIGAC

API en Rust (axum + sqlx) conectada a PostgreSQL en Neon.

## Configuración
1. Instalar Rust: https://rustup.rs
2. Copiar `.env.example` a `.env` y poner la cadena de conexión real
3. Ejecutar `cargo run` (el servidor queda en http://localhost:3000)

## Endpoints

### POST /auth/register
Body:
{ "nombre": "Ana", "correo": "ana@escuela.com", "password": "12345678" }

Respuestas:
- 201: { "id": 1, "nombre": "Ana", "correo": "ana@escuela.com", "rol": "estudiante" }
- 400: datos inválidos
- 409: el correo ya está registrado

### POST /auth/login
Body:
{ "correo": "ana@escuela.com", "password": "12345678" }

Respuestas:
- 200: mismos datos del usuario
- 401: credenciales incorrectas