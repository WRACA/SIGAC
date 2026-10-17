import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = ({ rolesPermitidos }) => {
    const userStr = localStorage.getItem('user');

    if (!userStr) {
        return <Navigate to="/login" replace />;
    }

    const user = JSON.parse(userStr);

    console.log("Rol del usuario en LocalStorage:", user.rol);
    console.log("Roles permitidos para esta vista:", rolesPermitidos);

    if (!user.rol) {
        return <Navigate to="/login" replace />;
    }

    if (!rolesPermitidos.includes(user.rol)) {
        return <Navigate to="/acceso-denegado" replace />;
    }

    return <Outlet />;
};