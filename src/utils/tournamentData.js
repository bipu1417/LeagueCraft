import { collection, doc } from "firebase/firestore";
import { db } from "../firebase";

export const LEGACY_PPL_2025_ID = "pundag-premier-league-2025";

export const legacyPpl2025Tournament = {
  id: LEGACY_PPL_2025_ID,
  name: "Pundag Premier League 2025",
  sport: "Cricket",
  year: 2025,
  status: "published",
  isLegacy: true,
  registrationStart: "2025-11-15T00:00",
  registrationEnd: "2025-11-26T16:59",
  winnerPrize: 35000,
  runnerUpPrize: 18000,
  upiId: "8972089184@pthdfc",
};

export const getTournamentDoc = (year, tournamentId) =>
  doc(db, "years", String(year), "tournaments", tournamentId);

export const getTournamentCollection = (year, tournamentId, collectionName) =>
  collection(db, "years", String(year), "tournaments", tournamentId, collectionName);

export const getDataCollection = (tournament, collectionName) => {
  if (tournament?.isLegacy) {
    return collection(db, collectionName);
  }

  return getTournamentCollection(tournament.year, tournament.id, collectionName);
};

export const isPastTournament = (tournament) => {
  if (!tournament) return false;
  if (tournament.isLegacy) return true;
  if (String(tournament.status || "").toLowerCase() === "completed") return true;

  const now = new Date();

  if (tournament.registrationEnd) {
    const registrationEnd = new Date(tournament.registrationEnd);
    if (!Number.isNaN(registrationEnd.getTime())) {
      return now > registrationEnd;
    }
  }

  if (tournament.year) {
    return Number(tournament.year) < now.getFullYear();
  }

  return false;
};

export const getRegistrationStatus = (tournament) => {
  if (isPastTournament(tournament)) {
    return { isOpen: false, isPast: true, isFuture: false, label: "Registration closed for past tournament" };
  }

  if (!tournament?.registrationStart || !tournament?.registrationEnd) {
    return { isOpen: false, isPast: false, isFuture: false, label: "Registration window not configured" };
  }

  const now = new Date();
  const start = new Date(tournament.registrationStart);
  const end = new Date(tournament.registrationEnd);

  if (now < start) {
    return { isOpen: false, isPast: false, isFuture: true, label: `Coming soon - opens ${start.toLocaleString()}` };
  }

  if (now > end) {
    return { isOpen: false, isPast: true, isFuture: false, label: `Closed ${end.toLocaleString()}` };
  }

  return { isOpen: true, isPast: false, isFuture: false, label: `Open until ${end.toLocaleString()}` };
};
