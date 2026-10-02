use serde::{Deserialize, Serialize};

// ---------- Datos que llegan del cliente ----------
#[derive(Deserialize)]
pub struct RegisterRequest {
    pub nombre: String,
    pub correo: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub correo: String,
    pub password: String,
}

// ---------- Datos que devolvemos (sin contraseña) ----------
#[derive(Serialize, sqlx::FromRow)]
pub struct Usuario {
    pub id: i32,
    pub nombre: String,
    pub correo: String,
    pub rol: String,
}

// Solo se usa internamente en el login, para comparar la contraseña.
#[derive(sqlx::FromRow)]
pub struct UsuarioLogin {
    pub id: i32,
    pub nombre: String,
    pub correo: String,
    pub rol: String,
    pub password: String, // aquí viene el hash guardado en la BD
}