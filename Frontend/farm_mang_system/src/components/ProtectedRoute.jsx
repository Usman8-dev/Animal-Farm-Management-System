import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  // Still checking with the backend (GET /user/me) — avoid flashing
  // a redirect before we actually know if the user is logged in.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F2]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e6e2d6] border-t-[#1f3d2e]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Optional: restrict to specific roles, e.g. <ProtectedRoute allowedRoles={["owner"]}>
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;