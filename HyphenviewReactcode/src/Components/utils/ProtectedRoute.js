import React from 'react';

import { Navigate, useLocation } from 'react-router-dom';
import { decryptData } from './EncriptionStore';


const ProtectedRoute = ({ Component }) => {
    const user = (() => {
        const encryptedData = localStorage.getItem("profile");
        return encryptedData ? decryptData(encryptedData) : null;
    })();
    const location = useLocation();

    if (!user || !user.group_id) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return <Component />;
};

export default ProtectedRoute;