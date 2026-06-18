import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, CheckCircle2, Gavel, Network, QrCode, ShieldCheck, Users } from "lucide-react";
import { useTournament } from "../context/TournamentContext";
import { useAuth } from "../context/AuthContext";

export default function TournamentManager() {
  const { tournaments, activeTournament, error: loadError, selectTournament, createTournament } = useTournament();
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: "",
    sport: "Cricket",
    year: new Date().getFullYear(),
    registrationStart: "",
    registrationEnd: "",
    winnerPrize: "",
    runnerUpPrize: "",
    ownerPhone: "",
    upiId: "",
    paymentQr: "",
    auctionEnabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const ownedTournaments = tournaments.filter((tournament) =>
    !tournament.isLegacy &&
    (tournament.ownerId === user?.uid || tournament.ownerEmail === user?.email)
  );
  const activeOwnedTournament = ownedTournaments.find((tournament) => tournament.id === activeTournament?.id);

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const resizePaymentQr = (file) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = async () => {
        URL.revokeObjectURL(objectUrl);
        const maxSize = 700;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error("Could not process payment QR image."));
            return;
          }

          resolve(await fileToDataUrl(blob));
        }, "image/jpeg", 0.82);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Invalid payment QR image."));
      };

      image.src = objectUrl;
    });

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;

    if (name === "paymentQr") {
      const file = files?.[0];
      if (!file) return;

      resizePaymentQr(file)
        .then((paymentQr) => {
          setForm((current) => ({ ...current, paymentQr }));
          setError("");
        })
        .catch((err) => setError(err.message));
      return;
    }

    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createTournament(form);
      setForm((current) => ({ ...current, name: "" }));
    } catch (err) {
      console.error("Tournament creation failed:", err);
      setError(err.code === "permission-denied"
        ? "You do not have permission yet. Complete premium payment and deploy the latest Firestore rules."
        : err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen px-0 py-4 text-white sm:px-4 sm:py-8">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-6">
        <form onSubmit={handleSubmit} className="surface rounded-lg p-4 space-y-4 sm:p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-yellow-200">Organizer console</p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Create Tournament</h1>
          </div>
          <input name="name" value={form.name} onChange={handleChange} required placeholder="Tournament name" className="input-surface w-full rounded-md px-3 py-2" />
          <div className="grid sm:grid-cols-2 gap-4">
            <input name="sport" value={form.sport} onChange={handleChange} required placeholder="Sport" className="input-surface w-full rounded-md px-3 py-2" />
            <input name="year" type="number" value={form.year} onChange={handleChange} required className="input-surface w-full rounded-md px-3 py-2" />
          </div>
          <input name="ownerPhone" value={form.ownerPhone} onChange={handleChange} required placeholder="Organizer WhatsApp / phone number" className="input-surface w-full rounded-md px-3 py-2" />
          <label className="block text-sm text-gray-300">
            Registration starts
            <input name="registrationStart" type="datetime-local" value={form.registrationStart} onChange={handleChange} required className="input-surface mt-1 w-full rounded-md px-3 py-2" />
          </label>
          <label className="block text-sm text-gray-300">
            Registration ends
            <input name="registrationEnd" type="datetime-local" value={form.registrationEnd} onChange={handleChange} required className="input-surface mt-1 w-full rounded-md px-3 py-2" />
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-sm text-gray-300">
              Winner prize
              <input name="winnerPrize" type="number" min="0" value={form.winnerPrize} onChange={handleChange} required placeholder="Winner amount" className="input-surface mt-1 w-full rounded-md px-3 py-2" />
            </label>
            <label className="block text-sm text-gray-300">
              Runner-up prize
              <input name="runnerUpPrize" type="number" min="0" value={form.runnerUpPrize} onChange={handleChange} required placeholder="Runner-up amount" className="input-surface mt-1 w-full rounded-md px-3 py-2" />
            </label>
          </div>
          <div className="rounded-lg border border-white/10 bg-gray-950/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-yellow-100">
              <QrCode size={17} />
              Registration Payment Details
            </div>
            <label className="block text-sm text-gray-300">
              UPI ID
              <input name="upiId" value={form.upiId} onChange={handleChange} required placeholder="example@upi" className="input-surface mt-1 w-full rounded-md px-3 py-2" />
            </label>
            <label className="mt-4 block text-sm text-gray-300">
              Scan & pay QR image
              <input name="paymentQr" type="file" accept="image/*" onChange={handleChange} required={!form.paymentQr} className="input-surface mt-1 w-full rounded-md px-3 py-2 text-sm" />
            </label>
            {form.paymentQr && (
              <img src={form.paymentQr} alt="Selected UPI QR" className="mt-4 h-32 w-32 rounded-lg bg-white object-contain p-2" />
            )}
          </div>
          <label className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 p-3 text-sm text-gray-200">
            <input name="auctionEnabled" type="checkbox" checked={form.auctionEnabled} onChange={handleChange} />
            Enable auction utility
          </label>
          {error && <p className="rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
          <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-yellow-400 px-4 py-3 font-bold text-gray-950 shadow-lg shadow-yellow-500/20 hover:bg-yellow-300 disabled:opacity-60">
            <CalendarPlus size={18} />
            {saving ? "Creating..." : "Create Tournament"}
          </button>
        </form>

        <section className="surface rounded-lg p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-yellow-200">Workspace</p>
              <h2 className="text-2xl font-bold text-white">Your Tournaments</h2>
            </div>
            {activeOwnedTournament && (
              <span className="inline-flex items-center gap-2 rounded-md bg-green-400/10 px-3 py-2 text-sm text-green-200">
                <ShieldCheck size={16} />
                Active selected
              </span>
            )}
          </div>
          {loadError && (
            <p className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
              {loadError}
            </p>
          )}
          <div className="mt-4 space-y-3">
            {ownedTournaments.map((tournament) => (
              <div key={tournament.id} className="rounded-md border border-white/10 bg-gray-950/70 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="safe-text font-semibold text-white">{tournament.name}</p>
                    <p className="text-sm text-gray-400">{tournament.year} • {tournament.sport}</p>
                    {(tournament.winnerPrize || tournament.runnerUpPrize) && (
                      <p className="mt-1 text-sm text-green-200">
                        Prizes: Winner Rs. {Number(tournament.winnerPrize || 0).toLocaleString("en-IN")} • Runner-up Rs. {Number(tournament.runnerUpPrize || 0).toLocaleString("en-IN")}
                      </p>
                    )}
                    {tournament.upiId && (
                      <p className="mt-1 text-sm text-yellow-100">UPI: {tournament.upiId}</p>
                    )}
                  </div>
                  <button onClick={() => selectTournament(tournament.id)} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm hover:bg-white/15 sm:w-auto">
                    {activeTournament?.id === tournament.id && <CheckCircle2 size={16} className="text-green-300" />}
                    {activeTournament?.id === tournament.id ? "Selected" : "Select"}
                  </button>
                </div>
              </div>
            ))}
            {ownedTournaments.length === 0 && (
              <p className="rounded-md border border-white/10 bg-gray-950/70 p-4 text-gray-300">
                You have not created any tournaments yet.
              </p>
            )}
          </div>

          {activeOwnedTournament && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/registration" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-white/10 px-4 py-2 hover:bg-white/15 sm:w-auto"><Users size={17} /> Registration</Link>
              <Link to="/create-team" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-white/10 px-4 py-2 hover:bg-white/15 sm:w-auto"><ShieldCheck size={17} /> Teams</Link>
              <Link to="/fixtures" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-white/10 px-4 py-2 hover:bg-white/15 sm:w-auto"><Network size={17} /> Fixtures & Groups</Link>
              <Link to="/auction" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-yellow-400 px-4 py-2 font-semibold text-gray-950 hover:bg-yellow-300 sm:w-auto"><Gavel size={17} /> Auction Utility</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
