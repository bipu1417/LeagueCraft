import React from "react";
import RegistrationForm from "../components/RegistrationForm";

export default function Registration({ isAdmin }) {
  return <RegistrationForm isAdmin={isAdmin} />;
}
