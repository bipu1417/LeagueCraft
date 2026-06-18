import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function SubscriptionRoute({ children }) {
  const { user, loading, isSubscribed, isSubscriptionExpired, effectiveRole } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (isSubscribed || effectiveRole === "admin") return children;

  return (
    <Navigate
      to="/subscription"
      replace
      state={isSubscriptionExpired ? { reason: "expired" } : undefined}
    />
  );
}
