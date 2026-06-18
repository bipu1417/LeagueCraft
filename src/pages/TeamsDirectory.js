import React, { useCallback, useEffect, useState } from "react";
import { getDocs } from "../firebase";
import { useTournament } from "../context/TournamentContext";
import { getDataCollection } from "../utils/tournamentData";
import { getTeamPurse } from "../utils/teamUtils";

export default function TeamsDirectory() {
  const { activeTournament } = useTournament();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTeams = useCallback(async () => {
    if (!activeTournament) {
      setTeams([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const snap = await getDocs(getDataCollection(activeTournament, "teamdetails"));
      setTeams(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
    } catch (err) {
      console.error("Unable to load teams:", err);
      setError(err.code === "permission-denied" ? "You do not have permission to view teams." : err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTournament]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  return (
    <div className="mx-auto max-w-6xl px-0 py-4 text-white sm:px-4 sm:py-8">
      <div className="surface rounded-lg p-4 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-yellow-200">Read-only</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Registered Teams</h1>
        {activeTournament && <p className="safe-text mt-2 text-gray-300">{activeTournament.name} • {activeTournament.year}</p>}

        {!activeTournament ? (
          <p className="mt-6 rounded-md border border-white/10 bg-gray-950/70 p-4 text-gray-300">
            Select a tournament first.
          </p>
        ) : loading ? (
          <p className="mt-6 text-gray-300">Loading teams...</p>
        ) : error ? (
          <p className="mt-6 rounded-md border border-red-400/30 bg-red-500/10 p-4 text-red-100">{error}</p>
        ) : teams.length === 0 ? (
          <p className="mt-6 rounded-md border border-white/10 bg-gray-950/70 p-4 text-gray-300">
            No teams registered yet.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <article key={team.id} className="rounded-lg border border-white/10 bg-gray-950/70 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  {team.logoBase64 ? (
                    <img
                      src={team.logoBase64}
                      alt={team.teamName}
                      loading="lazy"
                      decoding="async"
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 flex-none items-center justify-center rounded-lg bg-yellow-400 text-xl font-bold text-gray-950">
                      {team.teamName?.charAt(0) || "T"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="safe-text font-bold text-white">{team.teamName}</h2>
                    <p className="break-all text-sm text-gray-400">{team.teamUniqueId}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-1 text-sm text-gray-300">
                  <p className="safe-text">Owner: {team.ownerName || "-"}</p>
                  <p>Purse: Rs. {getTeamPurse(team)}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
