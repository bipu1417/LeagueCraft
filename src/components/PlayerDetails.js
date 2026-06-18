import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";

export default function PlayerDetails() {
  const { aadhaar } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!aadhaar) return;

    const fetchData = async () => {
      setLoading(true);
      setNotFound(false);
      setError(null);

      try {
        const ref = doc(db, "players", aadhaar);
        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) {
          setNotFound(true);
          setPlayer(null);
        } else {
          // snapshot.data() returns the object you stored
          const data = snapshot.data();

          // Normalize field names (use whatever exists in your data)
          const normalized = {
            id: snapshot.id,
            name: data.name ?? data.fullName ?? "—",
            age: data.age ?? "—",
            playerType: data.playerType ?? data.type ?? "—",
            mnumber: data.mnumber ?? data.mobile ?? "—",
            aadhaar: data.aadhaar ?? data.aadhar ?? "—",
            address: data.address ?? "—",
            photo:
              data.photo ??
              data.playerPhoto ?? // your example uses playerPhoto
              data.player_photo ??
              "",
            paymentScreenshot: data.paymentScreenshot ?? data.paymentScreenshotUrl ?? "",
            upiRefNo: data.upiRefNo ?? data.upiRef ?? data.upi ?? "",
            approved: data.approved ?? false,
            timestamp: data.timestamp ?? data.approvedAt ?? null,
            // include any other fields you expect
            ...data,
          };

          setPlayer(normalized);
        }
      } catch (err) {
        console.error("Error fetching player:", err);
        setError("Failed to load player. Check console.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [aadhaar]);

  if (loading) {
    return <p className="text-center text-gray-300 mt-10">Loading player details...</p>;
  }

  if (error) {
    return (
      <div className="text-center mt-10 text-red-400">
        <p>{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 bg-yellow-500 text-black px-4 py-2 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (notFound || !player) {
    return (
      <div className="text-center mt-10 text-gray-300">
        <p>Player not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 bg-yellow-500 text-black px-4 py-2 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="text-center max-w-lg mx-auto mt-10 p-6 bg-gray-900 text-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">{player.name}</h2>

      {player.photo ? (
        // show provided photo or a placeholder
        <img
          src={player.photo}
          alt={player.name}
          className="w-40 h-40 rounded-full mx-auto mb-4 object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div className="w-40 h-40 rounded-full mx-auto mb-4 flex items-center justify-center bg-gray-700 text-xl">
          {player.name ? player.name[0] : "—"}
        </div>
      )}

      <p>
        <strong>Age:</strong> {player.age}
      </p>
      <p>
        <strong>Type:</strong> {player.playerType}
      </p>
      <p>
        <strong>Mobile:</strong> {player.mnumber}
      </p>
      <p>
        <strong>Aadhaar:</strong> {player.aadhaar ?? "—"}
      </p>
      <p>
        <strong>Address:</strong> {player.address ?? "—"}
      </p>

      {player.upiRefNo && (
        <p>
          <strong>UPI Ref:</strong> {player.upiRefNo}
        </p>
      )}

      <div className="mt-4">
        <button
          onClick={() => navigate(-1)}
          className="bg-yellow-500 text-black px-4 py-2 rounded"
        >
          Back
        </button>
      </div>
    </div>
  );
}
