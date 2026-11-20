import { Navigate, Outlet } from 'react-router-dom';
import { obtenerSesionActiva } from '../services/api.js';

export const ProtectedRoute = ({ rolesPermitidos }) => {
    // Sin sesión o con token expirado: volver al login
    const user = obtenerSesionActiva();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!rolesPermitidos.includes(user.rol)) {
        return <Navigate to="/acceso-denegado" replace />;
    }

    return <Outlet />;
};
