import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
    const token = localStorage.getItem("auth_token");

    if (!token) {
        return <Navigate to="/unlock" replace />;
    }

    return children;
}