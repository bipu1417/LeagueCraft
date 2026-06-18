// ---------------- USER LOGIN PAGE ----------------
// Login.jsx
import React from "react";
import { Link } from "react-router-dom";
import GoogleLoginButton from "../custom/GoogleLoginButton";

export function Login() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center sm:px-6 md:px-10">
      <div className="w-full max-w-96 rounded-2xl border border-yellow-400/30 bg-black/60 p-6 shadow-lg backdrop-blur-md sm:p-8">
        <h2 className="mb-6 text-center text-2xl font-bold text-yellow-400">
          Sign in
        </h2>

        <GoogleLoginButton label="Continue with Google" />

        <p className="mt-4 text-sm text-gray-300">
          New here?{" "}
          <Link to="/signup" className="text-yellow-400 hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
