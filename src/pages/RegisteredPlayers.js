import React, { useEffect, useMemo, useState } from "react";
import { onSnapshot, query, orderBy } from "../firebase";
import { useTournament } from "../context/TournamentContext";
import { getDataCollection } from "../utils/tournamentData";

export default function RegisteredPlayers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { activeTournament } = useTournament();

  useEffect(() => {
    if (!activeTournament) {
      setPlayers([]);
      setLoading(false);
      return undefined;
    }

    const q = query(
      getDataCollection(activeTournament, "players"),
      orderBy("name", "asc")
    );

    setLoading(true);
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setPlayers(data);
        setLoading(false);
      },
      (err) => {
        console.error("Realtime listener error:", err);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [activeTournament]);

  const filteredPlayers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return players;

    return players.filter(
      (p) =>
        p.name?.toLowerCase().includes(normalizedSearch) ||
        p.address?.toLowerCase().includes(normalizedSearch)
    );
  }, [players, search]);

  return (
    <div className="min-h-screen bg-gray-900 px-0 py-6 text-gray-200 sm:px-4 sm:py-8">
      
      {/* Title */}
      <h1 className="safe-text text-center text-2xl sm:text-4xl font-extrabold text-yellow-400 drop-shadow-lg mb-6">
        Registered Players
      </h1>
      {activeTournament && (
        <p className="text-center text-sm text-gray-400 mb-3">
          {activeTournament.name} • {activeTournament.year}
        </p>
      )}

      {/* Total Players Count */}
      <p className="text-center text-gray-300 mb-6 text-lg">
        Total Players:{" "}
        <span className="text-yellow-400 font-bold">{players.length}</span>
        {search && (
          <>
            {" "} | Showing:{" "}
            <span className="text-green-400 font-bold">
              {filteredPlayers.length}
            </span>
          </>
        )}
      </p>

      {/* Search */}
      <div className="flex justify-center mb-6">
        <input
          type="text"
          placeholder="Search by name or address..."
          className="w-full max-w-md px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200
                     focus:ring-2 focus:ring-yellow-400 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-800 rounded-xl p-4 h-48"
            />
          ))}
        </div>
      )}

      {/* Player Cards */}
      {!loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              className="bg-gray-800/80 border border-gray-700 rounded-2xl p-4 shadow-md
                         hover:shadow-yellow-400/30 hover:border-yellow-400 transition duration-300"
            >
              {/* Player Photo */}
              <div className="flex justify-center">
                <img
                  src={player.photo}
                  alt={player.name}
                  loading="lazy"
                  decoding="async"
                  className="h-24 w-24 rounded-full border-4 border-yellow-400 shadow-lg object-cover"
                />
              </div>

              {/* Details */}
              <div className="mt-4 text-center">
                <h2 className="safe-text text-xl font-bold text-yellow-300">
                  {player.name}
                </h2>
                <p className="text-sm text-gray-400">{player.playerType}</p>

                <p className="safe-text mt-2 text-gray-300 text-sm whitespace-pre-line">
                  {player.address}
                </p>
              </div>

              {/* Footer */}
              <div className="mt-4 text-center text-gray-400 text-xs">
                <span className="break-all">Player ID: {player.aadhaar}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredPlayers.length === 0 && (
        <div className="text-center text-gray-400 mt-10">
          No players found matching your search.
        </div>
      )}
    </div>
  );
}
