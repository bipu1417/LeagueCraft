import React from "react";
import { Link } from "react-router-dom";
import { CalendarDays, CheckCircle2, Gavel, Trophy, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTournament } from "../context/TournamentContext";
import { getRegistrationStatus } from "../utils/tournamentData";

export default function TournamentDirectory() {
  const { isSubscribed, effectiveRole } = useAuth();
  const { tournaments, activeTournament, loading, error, selectTournament } = useTournament();

  return (
    <div className="mx-auto max-w-6xl px-0 py-4 text-white sm:px-4 sm:py-8">
      <div className="surface rounded-lg p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-yellow-200">Hosted tournaments</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Select a Tournament</h1>
            <p className="mt-2 text-gray-300">
              Choose a tournament to view players, registered teams, auction details, and registration.
            </p>
          </div>
          {(isSubscribed || effectiveRole === "admin") && (
            <Link
              to="/manage-tournaments"
              className="inline-flex w-full justify-center rounded-md bg-yellow-400 px-4 py-2 font-semibold text-gray-950 hover:bg-yellow-300 sm:w-auto"
            >
              Manage Tournaments
            </Link>
          )}
        </div>

        {error && <p className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 p-3 text-red-100">{error}</p>}

        {loading ? (
          <p className="mt-6 text-gray-300">Loading tournaments...</p>
        ) : tournaments.length === 0 ? (
          <p className="mt-6 rounded-md border border-white/10 bg-gray-950/70 p-4 text-gray-300">
            No hosted tournaments are available yet.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tournaments.map((tournament) => {
              const registration = getRegistrationStatus(tournament);
              const selected = activeTournament?.id === tournament.id;
              const canRegister = registration.isOpen && !registration.isPast;

              return (
                <article
                  key={tournament.id}
                  className={`rounded-lg border p-4 transition ${
                    selected
                      ? "border-yellow-300 bg-yellow-300/10"
                      : "border-white/10 bg-gray-950/70 hover:border-white/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400 text-gray-950">
                        <Trophy size={20} />
                      </div>
                      <h2 className="safe-text text-xl font-bold">{tournament.name}</h2>
                      <p className="mt-1 text-sm text-gray-400">{tournament.sport} • {tournament.year}</p>
                    </div>
                    {selected && <CheckCircle2 className="text-green-300" size={22} />}
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-300">
                    <CalendarDays size={16} className="text-yellow-200" />
                    {registration.label}
                  </div>

                  <button
                    type="button"
                    onClick={() => selectTournament(tournament.id)}
                    className="mt-4 w-full rounded-md bg-white/10 px-4 py-2 font-semibold hover:bg-white/15"
                  >
                    {selected ? "Selected" : "Select Tournament"}
                  </button>

                  {selected && (
                    <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      <Link to="/registered-players" className="rounded-md bg-gray-900 px-3 py-2 hover:bg-gray-800">
                        <Users size={15} className="mr-1 inline" />
                        Players
                      </Link>
                      <Link to="/teams" className="rounded-md bg-gray-900 px-3 py-2 hover:bg-gray-800">
                        Teams
                      </Link>
                      <Link to="/auction" className="rounded-md bg-gray-900 px-3 py-2 hover:bg-gray-800">
                        <Gavel size={15} className="mr-1 inline" />
                        Auction
                      </Link>
                      {canRegister ? (
                        <Link to="/registration" className="rounded-md bg-gray-900 px-3 py-2 hover:bg-gray-800">
                          Register
                        </Link>
                      ) : (
                        <span
                          title={registration.label}
                          className="cursor-not-allowed rounded-md bg-gray-900/60 px-3 py-2 text-gray-500"
                        >
                          {registration.isFuture ? "Coming Soon" : "Registration Closed"}
                        </span>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
