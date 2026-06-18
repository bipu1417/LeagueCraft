import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { addDoc, collection, db, getDocs, setDoc, serverTimestamp } from "../firebase";
import { getTournamentDoc, legacyPpl2025Tournament } from "../utils/tournamentData";
import { useAuth } from "./AuthContext";

const TournamentContext = createContext();

export function TournamentProvider({ children }) {
  const { user, profile, isSubscribed, effectiveRole, loading: authLoading } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [activeTournamentId, setActiveTournamentId] = useState(localStorage.getItem("activeTournamentId") || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setTournaments([]);
      setActiveTournamentId("");
      localStorage.removeItem("activeTournamentId");
      setError("");
      setLoading(false);
      return;
    }

    const loadTournaments = async () => {
      setLoading(true);
      setError("");
      try {
        const ref = collection(db, "tournaments");
        const snap = await getDocs(ref);
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
        const hasLegacy = list.some((item) => item.id === legacyPpl2025Tournament.id);
        const availableTournaments = hasLegacy ? list : [legacyPpl2025Tournament, ...list];

        setTournaments(availableTournaments);
        if (availableTournaments[0]) {
          setActiveTournamentId((currentId) => {
            if (currentId) return currentId;
            localStorage.setItem("activeTournamentId", availableTournaments[0].id);
            return availableTournaments[0].id;
          });
        }
      } catch (err) {
        console.error("Unable to load tournaments:", err);
        setTournaments([legacyPpl2025Tournament]);
        setActiveTournamentId((currentId) => {
          if (currentId) return currentId;
          localStorage.setItem("activeTournamentId", legacyPpl2025Tournament.id);
          return legacyPpl2025Tournament.id;
        });
        setError(err.code === "permission-denied"
          ? "Tournament list could not be loaded. Please sign in again or check Firestore rules."
          : err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTournaments();
  }, [authLoading, user]);

  const activeTournament = useMemo(
    () => tournaments.find((t) => t.id === activeTournamentId) || tournaments[0] || null,
    [activeTournamentId, tournaments]
  );
  const canManageActiveTournament = Boolean(
    user &&
    isSubscribed &&
    activeTournament &&
    !activeTournament.isLegacy &&
    activeTournament.ownerId === user.uid
  );

  const selectTournament = useCallback((id) => {
    setActiveTournamentId(id);
    localStorage.setItem("activeTournamentId", id);
  }, []);

  const createTournament = useCallback(async (payload) => {
    if (!isSubscribed && effectiveRole !== "admin") {
      throw new Error("Premium subscription is required to create tournaments.");
    }

    const year = Number(payload.year || new Date().getFullYear());
    const data = {
      name: payload.name,
      sport: payload.sport || "Cricket",
      year,
      ownerId: user.uid,
      ownerEmail: user.email,
      ownerPhone: String(payload.ownerPhone || profile?.phone || profile?.subscription?.contactPhone || "").trim(),
      registrationStart: payload.registrationStart,
      registrationEnd: payload.registrationEnd,
      winnerPrize: Number(payload.winnerPrize || 0),
      runnerUpPrize: Number(payload.runnerUpPrize || 0),
      upiId: String(payload.upiId || "").trim(),
      paymentQr: payload.paymentQr || "",
      auctionEnabled: Boolean(payload.auctionEnabled),
      subscriptionRequired: true,
      status: "draft",
      createdAt: serverTimestamp(),
    };

    const indexDoc = await addDoc(collection(db, "tournaments"), data);
    await setDoc(getTournamentDoc(year, indexDoc.id), { ...data, indexId: indexDoc.id });
    setTournaments((items) => [{ id: indexDoc.id, ...data }, ...items]);
    selectTournament(indexDoc.id);
    return indexDoc.id;
  }, [effectiveRole, isSubscribed, profile?.phone, profile?.subscription?.contactPhone, selectTournament, user]);

  const value = useMemo(() => ({
    tournaments,
    activeTournament,
    canManageActiveTournament,
    loading,
    error,
    selectTournament,
    createTournament,
  }), [
    activeTournament,
    canManageActiveTournament,
    createTournament,
    error,
    loading,
    selectTournament,
    tournaments,
  ]);

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}

export const useTournament = () => useContext(TournamentContext);
