import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminLogin() {
  const { effectiveRole } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 sm:px-6 md:px-10 text-center">
      <div className="bg-black/60 backdrop-blur-md p-8 rounded-2xl shadow-lg w-80 border border-yellow-400/30">
        <h2 className="text-2xl font-bold text-yellow-400 text-center mb-6">
          Admin Access
        </h2>
        <p className="text-gray-300 text-sm">
          Admin rights are now controlled from your Firebase user role, not a shared password.
        </p>
        <Link
          to={effectiveRole === "admin" ? "/pending-approval" : "/profile"}
          className="mt-5 inline-block w-full bg-yellow-500 text-black font-semibold py-2 rounded hover:bg-yellow-400 transition"
        >
          {effectiveRole === "admin" ? "Open Admin Panel" : "Go to Profile"}
        </Link>
      </div>
    </div>
  );
}
