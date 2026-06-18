import React, { useState } from "react";
import PaymentPage from "./PaymentPage";
import { addDoc, serverTimestamp } from "../firebase";
import { useTournament } from "../context/TournamentContext";
import { getRegistrationStatus, getTournamentCollection } from "../utils/tournamentData";
import { notifySafely } from "../utils/notificationService";

const emptyForm = {
  name: "",
  age: "",
  playerType: "",
  mnumber: "",
  aadhaar: "",
  address: "",
  photo: null,
  paymentScreenshot: null,
  upiRefNo: "",
};

export default function RegistrationForm() {
  const { activeTournament } = useTournament();
  const [formData, setFormData] = useState(emptyForm);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const registration = getRegistrationStatus(activeTournament);

  const blobToDataUrl = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const compressImage = (file, maxWidth = 900, initialQuality = 0.72) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      const canvasToBlob = (canvas, quality) =>
        new Promise((done) => canvas.toBlob(done, "image/jpeg", quality));

      image.onload = async () => {
        URL.revokeObjectURL(objectUrl);
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        let quality = initialQuality;
        let blob = await canvasToBlob(canvas, quality);

        while (blob && blob.size > 550 * 1024 && quality > 0.35) {
          quality -= 0.08;
          blob = await canvasToBlob(canvas, quality);
        }

        if (!blob) {
          reject(new Error("Could not process image. Please try another file."));
          return;
        }

        resolve(blob);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Invalid image file."));
      };

      image.src = objectUrl;
    });

  const uploadRegistrationFile = async (file, folder) => {
    if (!file) return "";
    const compressedBlob = await compressImage(file);
    return blobToDataUrl(compressedBlob);
  };

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setFormData((current) => ({ ...current, [name]: files?.[0] || value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!activeTournament) {
      setSubmitMessage("Please select a tournament first.");
      return;
    }

    if (!registration.isOpen) {
      setSubmitMessage(
        registration.isPast
          ? "Registration is closed for past tournaments."
          : registration.label
      );
      return;
    }

    setSubmitting(true);
    try {
      const photo = await uploadRegistrationFile(formData.photo, "photos");
      const paymentScreenshot = await uploadRegistrationFile(formData.paymentScreenshot, "payments");
      const pendingRef = getTournamentCollection(activeTournament.year, activeTournament.id, "pendingPlayers");

      const playerPayload = {
        name: formData.name,
        age: formData.age,
        playerType: formData.playerType,
        mnumber: formData.mnumber,
        aadhaar: formData.aadhaar,
        address: formData.address,
        upiRefNo: formData.upiRefNo,
        photo,
        paymentScreenshot,
        approved: false,
        paymentStatus: "pending",
        tournamentId: activeTournament.id,
        tournamentYear: activeTournament.year,
        createdAt: serverTimestamp(),
      };

      await addDoc(pendingRef, playerPayload);

      await notifySafely({
        type: "player_registration_submitted",
        recipientRole: "admin",
        recipientUserId: activeTournament.ownerId,
        recipientEmail: activeTournament.ownerEmail,
        recipientPhone: activeTournament.ownerPhone,
        title: "New player registration",
        message: `${formData.name} submitted registration for ${activeTournament.name}. Mobile: ${formData.mnumber}. UPI Ref: ${formData.upiRefNo}.`,
        metadata: {
          tournamentId: activeTournament.id,
          tournamentYear: activeTournament.year,
          playerName: formData.name,
          playerPhone: formData.mnumber,
          upiRefNo: formData.upiRefNo,
        },
      });

      setFormData(emptyForm);
      setSubmitMessage("Registration submitted. Please wait for organizer approval.");
    } catch (error) {
      console.error("Registration error:", error);
      setSubmitMessage(error.message || "Error submitting registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeTournament) {
    return (
      <div className="min-h-[70vh] bg-gray-900 text-white flex items-center justify-center px-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md text-center">
          <h1 className="text-xl font-bold text-yellow-300">No tournament selected</h1>
          <p className="text-gray-300 mt-2">Create or select a tournament before opening registrations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-0 py-4 sm:px-4 sm:py-10">
      <div className="w-full max-w-5xl grid lg:grid-cols-[0.8fr_1.2fr] gap-6">
        <aside className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-100 sm:p-6">
          <h1 className="safe-text text-2xl font-bold text-yellow-300">{activeTournament.name}</h1>
          <p className="text-gray-300 mt-1">{activeTournament.year} Registration</p>
          {activeTournament.isLegacy && (
            <p className="mt-3 rounded-md border border-yellow-300/30 bg-yellow-300/10 p-3 text-sm text-yellow-100">
              This tournament is an existing archive. Players, teams and auction details are available as read-only data.
            </p>
          )}
          <p className={registration.isOpen ? "text-green-300 mt-4" : "text-red-300 mt-4"}>
            {registration.label}
          </p>
          <div className="mt-5">
            <PaymentPage tournament={activeTournament} />
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-yellow-300">Player Registration</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <input name="name" value={formData.name} onChange={handleChange} required placeholder="Full name" className="rounded-md bg-gray-900 border border-gray-700 px-3 py-2" />
            <input name="age" type="number" value={formData.age} onChange={handleChange} required placeholder="Age" className="rounded-md bg-gray-900 border border-gray-700 px-3 py-2" />
            <select name="playerType" value={formData.playerType} onChange={handleChange} required className="rounded-md bg-gray-900 border border-gray-700 px-3 py-2">
              <option value="">Select player type</option>
              <option value="Batsman">Batsman</option>
              <option value="Bowler">Bowler</option>
              <option value="All-Rounder">All-Rounder</option>
              <option value="Wicket Keeper">Wicket Keeper</option>
            </select>
            <input name="mnumber" value={formData.mnumber} onChange={handleChange} required placeholder="Mobile number" className="rounded-md bg-gray-900 border border-gray-700 px-3 py-2" />
            <input name="aadhaar" value={formData.aadhaar} onChange={handleChange} required placeholder="Player ID / Aadhaar" className="rounded-md bg-gray-900 border border-gray-700 px-3 py-2" />
            <input name="upiRefNo" value={formData.upiRefNo} onChange={handleChange} required placeholder="UPI reference number" className="rounded-md bg-gray-900 border border-gray-700 px-3 py-2" />
          </div>
          <textarea name="address" value={formData.address} onChange={handleChange} rows="3" placeholder="Address" className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2" />
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-300">
            <label>
              Player photo
              <input type="file" name="photo" accept="image/*" onChange={handleChange} required className="mt-1 w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2" />
            </label>
            <label>
              Payment screenshot
              <input type="file" name="paymentScreenshot" accept="image/*" onChange={handleChange} required className="mt-1 w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2" />
            </label>
          </div>
          {submitMessage && <p className="text-yellow-300">{submitMessage}</p>}
          <button disabled={!registration.isOpen || submitting} className="w-full rounded-md bg-yellow-500 px-6 py-2 font-semibold text-black hover:bg-yellow-400 disabled:opacity-50 sm:w-auto">
            {submitting ? "Submitting..." : "Submit Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}
