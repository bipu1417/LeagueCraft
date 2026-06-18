import React, { useEffect, useState } from "react";
import { db, doc, getDoc } from "../firebase";
import { useParams, useNavigate } from "react-router-dom";
import { useTournament } from "../context/TournamentContext";

export default function PendingPlayerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeTournament } = useTournament();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPlayer = async () => {
      if (!activeTournament) {
        setPlayer(null);
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "years", String(activeTournament.year), "tournaments", activeTournament.id, "pendingPlayers", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setPlayer({ id: snap.id, ...snap.data() });
        } else {
          setPlayer(null);
        }
        setError("");
      } catch (err) {
        console.error("Unable to load pending player details:", err);
        setError(err.code === "permission-denied" ? "You do not have permission to view this pending registration." : err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [activeTournament, id]);

  if (loading) return <p className="text-center text-gray-300">Loading...</p>;
  if (error) return <p className="text-center text-red-300">{error}</p>;
  if (!player) return <p className="text-center text-gray-400">Player not found</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-10 flex flex-col items-center">
      <div className="max-w-xl w-full bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">

        <button
          onClick={() => navigate(-1)}
          className="text-yellow-400 mb-4 underline"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-yellow-400 mb-4 text-center">
          Player Details
        </h1>

        <div className="flex justify-center mb-4">
          {player.photo ? (
            <img
              src={player.photo}
              className="w-28 h-28 rounded-full border-2 border-yellow-400 object-cover"
              alt="Player"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gray-600 flex items-center justify-center text-yellow-300 text-3xl">
              {player.name[0]}
            </div>
          )}
        </div>

        <div className="space-y-2 text-gray-300">
          <p><span className="text-yellow-400">Name:</span> {player.name}</p>
          <p><span className="text-yellow-400">Age:</span> {player.age}</p>
          <p><span className="text-yellow-400">Type:</span> {player.playerType}</p>
          <p><span className="text-yellow-400">Mobile:</span> {player.mnumber}</p>
          <p><span className="text-yellow-400">Aadhaar:</span> {player.aadhaar}</p>
          <p><span className="text-yellow-400">Address:</span> {player.address}</p>
          <p><span className="text-yellow-400">UPI Ref No:</span> {player.upiRefNo || "N/A"}</p>

          {player.paymentScreenshot && (
            <div className="mt-3">
              <p className="text-yellow-400 mb-2">Payment Screenshot:</p>
              <img
                src={player.paymentScreenshot}
                className="w-full rounded-lg border border-gray-700"
                alt="Payment"
              />
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          {/* <button
            onClick={handleApprove}
            className="bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded-md font-semibold"
          >
            Approve
          </button>

          <button
            onClick={handleReject}
            className="bg-red-500 hover:bg-red-400 text-black px-4 py-2 rounded-md font-semibold"
          >
            Reject
          </button> */}
        </div>
      </div>
    </div>
  );
}
