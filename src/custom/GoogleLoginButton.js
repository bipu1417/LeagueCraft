import React, { useState } from "react";
import { auth, googleProvider } from "../firebase"; 
import { signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { AlertModal } from "../components/ui/AppModal";

const GoogleLoginButton = ({ label = "Sign in with Google", redirectTo = "/profile" }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      console.error("Google Login Failed:", error);
      setAlert({
        title: "Google login failed",
        message: "Please try again.",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <button
      onClick={handleGoogleLogin}
      disabled={loading}
      className="
        w-full mt-4 py-3 
        bg-white border border-gray-300 
        text-gray-700 font-semibold 
        rounded-xl shadow-md 
        hover:shadow-lg hover:bg-gray-50 
        transition-all duration-200 
        flex items-center justify-center gap-3
      "
    >
      <img
        src='https://www.svgrepo.com/show/355037/google.svg'
        alt='google'
        className="w-6 h-6"
      />

      {loading ? "Signing in..." : label}
    </button>
    <AlertModal
      open={Boolean(alert)}
      title={alert?.title}
      message={alert?.message}
      tone={alert?.tone}
      onClose={() => setAlert(null)}
    />
    </>
  );
};

export default GoogleLoginButton;
