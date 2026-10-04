export const login = async (email, password) => {
    const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo: email, password }),
    });

    if (!response.ok) {
        throw new Error('Credenciales inválidas o error en el servidor');
    }

    return response.json();
};