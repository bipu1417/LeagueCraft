import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useTournament } from "../context/TournamentContext";
import { getTournamentCollection } from "../utils/tournamentData";
import { useAuth } from "../context/AuthContext";
import { notifySafely } from "../utils/notificationService";
import { AlertModal, ConfirmModal } from "./ui/AppModal";

export default function PendingApproval() {
  const [pendingPlayers, setPendingPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const navigate = useNavigate();
  const { activeTournament, canManageActiveTournament } = useTournament();
  const { user } = useAuth();

  const showAlert = (title, message, tone = "info") => {
    setAlert({ title, message, tone });
  };

  const requestConfirmation = (dialog) =>
    new Promise((resolve) => {
      setConfirmDialog({
        ...dialog,
        onConfirm: () => {
          setConfirmDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        },
      });
    });

  useEffect(() => {
    if (!activeTournament || !canManageActiveTournament) {
      setPendingPlayers([]);
      setLoading(false);
      setError("");
      return undefined;
    }

    const pendingRef = getTournamentCollection(activeTournament.year, activeTournament.id, "pendingPlayers");
    const unsubscribe = onSnapshot(
      pendingRef,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPendingPlayers(data);
        setError("");
        setLoading(false);
      },
      (err) => {
        console.error("Pending approvals listener error:", err);
        setError(err.code === "permission-denied"
          ? "You do not have permission to load approvals. Complete premium payment and deploy Firestore rules."
          : err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeTournament, canManageActiveTournament]);

  const checkDuplicate = async (player) => {
    const playersRef = getTournamentCollection(activeTournament.year, activeTournament.id, "players");

    const [snap1, snap2, snap3] = await Promise.all([
      getDocs(query(playersRef, where("mnumber", "==", player.mnumber))),
      getDocs(query(playersRef, where("aadhaar", "==", player.aadhaar))),
      getDocs(query(playersRef, where("upiRefNo", "==", player.upiRefNo))),
    ]);

    if (!snap1.empty) return { duplicate: true, data: snap1.docs[0].data(), field: "Mobile Number" };
    if (!snap2.empty) return { duplicate: true, data: snap2.docs[0].data(), field: "Aadhaar" };
    if (!snap3.empty) return { duplicate: true, data: snap3.docs[0].data(), field: "UPI Ref No" };

    return { duplicate: false };
  };

  const handleApprove = async (player) => {
  try {
    if (!canManageActiveTournament) {
      showAlert(
        "Read-only tournament",
        "Only the tournament creator with an active paid subscription can approve registrations.",
        "warning"
      );
      return;
    }

    const duplicateCheck = await checkDuplicate(player);

    if (duplicateCheck.duplicate) {
      const p = duplicateCheck.data;

      showAlert(
        "Duplicate entry found",
        `Duplicate field: ${duplicateCheck.field}\n\nExisting Player:\nName: ${p.name}\nMobile: ${p.mnumber}\nAadhaar: ${p.aadhaar}\nUPI Ref: ${p.upiRefNo}\n\nThis player cannot be approved.`,
        "warning"
      );

      return;
    }

    await addDoc(getTournamentCollection(activeTournament.year, activeTournament.id, "players"), {
      ...player,
      approved: true,
      approvedAt: new Date().toISOString(),
    });

    await deleteDoc(doc(db, "years", String(activeTournament.year), "tournaments", activeTournament.id, "pendingPlayers", player.id));

    await notifySafely({
      type: "player_registration_approved",
      recipientRole: "user",
      recipientPhone: player.mnumber,
      title: "Registration approved",
      message: `Hi ${player.name}, your registration for ${activeTournament.name} has been approved.`,
      metadata: {
        tournamentId: activeTournament.id,
        tournamentYear: activeTournament.year,
        playerId: player.id,
        playerName: player.name,
      },
      senderId: user?.uid,
      senderEmail: user?.email,
    });

    showAlert("Approved", `${player.name} approved and moved to Registered Players.`, "success");
  } catch (err) {
    console.error("Error approving player:", err);
    showAlert("Approval failed", "Something went wrong while approving.", "error");
  }
};
  const handleReject = async (player) => {
    if (!canManageActiveTournament) {
      showAlert(
        "Read-only tournament",
        "Only the tournament creator with an active paid subscription can reject registrations.",
        "warning"
      );
      return;
    }

    const shouldReject = await requestConfirmation({
      title: "Reject registration?",
      message: `${player.name} will be removed from pending approvals.`,
      confirmText: "Reject",
      tone: "error",
    });

    if (shouldReject) {
      try {
        await deleteDoc(doc(db, "years", String(activeTournament.year), "tournaments", activeTournament.id, "pendingPlayers", player.id));

        await notifySafely({
          type: "player_registration_rejected",
          recipientRole: "user",
          recipientPhone: player.mnumber,
          title: "Registration rejected",
          message: `Hi ${player.name}, your registration for ${activeTournament.name} was not approved. Please contact the organizer for details.`,
          metadata: {
            tournamentId: activeTournament.id,
            tournamentYear: activeTournament.year,
            playerId: player.id,
            playerName: player.name,
          },
          senderId: user?.uid,
          senderEmail: user?.email,
        });

        showAlert("Rejected", `${player.name} has been rejected.`, "info");
      } catch (err) {
        console.error("Error rejecting player:", err);
        showAlert("Rejection failed", "Something went wrong while rejecting.", "error");
      }
    }
  };

  // Navigate to Pending Player Details Page
  const openDetails = (player) => {
    navigate(`/pending-player/${player.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-6 px-0 sm:px-6 sm:py-10">
      <h1 className="safe-text text-2xl sm:text-4xl font-bold text-yellow-400 mb-8 border-b border-yellow-500 pb-3 text-center">
        Pending Player Approvals
      </h1>
      {activeTournament && !canManageActiveTournament && (
        <p className="mb-6 max-w-3xl rounded-lg border border-yellow-300/30 bg-yellow-300/10 p-4 text-center text-yellow-100">
          This tournament is read-only for you. Only the creator of this tournament with an active paid subscription can approve or reject players.
        </p>
      )}

      {loading ? (
        <p className="text-gray-400">Loading players...</p>
      ) : error ? (
        <p className="max-w-xl rounded-md border border-red-400/30 bg-red-500/10 p-4 text-center text-red-100">{error}</p>
      ) : pendingPlayers.length === 0 ? (
        <p className="text-gray-400">No pending approvals right now.</p>
      ) : (
        <>
          {/* ------------------ MOBILE VIEW ------------------ */}
          <div className="sm:hidden w-full flex flex-col gap-4">
            {pendingPlayers.map((player) => (
              <div
                key={player.id}
                onClick={() => openDetails(player)}
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-md cursor-pointer"
              >
                <div className="flex min-w-0 items-center gap-4">
                  {player.photo ? (
                    <img
                      src={player.photo}
                      alt={player.name}
                      className="w-16 h-16 rounded-full border-2 border-yellow-400 object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center text-yellow-300 font-bold text-lg">
                      {player.name[0]}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="safe-text text-lg font-semibold text-yellow-400">
                      {player.name}
                    </p>
                    <p className="text-sm text-gray-400">
                      {player.playerType} • Age {player.age}
                    </p>
                    <p className="safe-text text-sm text-gray-400">
                      {player.mnumber} • {player.aadhaar}
                    </p>
                    <p className="safe-text text-sm text-gray-400">
                      UPI Ref: {player.upiRef || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Payment Screenshot */}
                {player.paymentScreenshot && (
                  <img
                    src={player.paymentScreenshot}
                    alt="Payment Screenshot"
                    className="w-full h-40 object-contain rounded-lg mt-3 border border-gray-700"
                  />
                )}

                <div className="flex flex-col justify-end gap-2 mt-4 sm:flex-row">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApprove(player);
                    }}
                    disabled={!canManageActiveTournament}
                    className="bg-green-500 hover:bg-green-400 text-black font-semibold px-4 py-1.5 rounded-md disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReject(player);
                    }}
                    disabled={!canManageActiveTournament}
                    className="bg-red-500 hover:bg-red-400 text-black font-semibold px-4 py-1.5 rounded-md disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ------------------ DESKTOP VIEW TABLE ------------------ */}
          <div className="hidden sm:block overflow-x-auto w-full max-w-7xl rounded-lg border border-gray-700 shadow-lg">
            <table className="responsive-table text-sm sm:text-base">
              <thead className="bg-gray-800 text-yellow-400">
                <tr>
                  {[
                    "Name",
                    "Age",
                    "Type",
                    "Mobile",
                    "Aadhaar",
                    "UPI Ref",
                    "Payment SS",
                    "Photo",
                    "Actions",
                  ].map((head) => (
                    <th key={head} className="px-4 py-3 text-left whitespace-nowrap">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {pendingPlayers.map((player) => (
                  <tr
                    key={player.id}
                    onClick={() => openDetails(player)}
                    className="border-t border-gray-700 hover:bg-gray-800 transition cursor-pointer"
                  >
                    <td className="px-4 py-3">{player.name}</td>
                    <td className="px-4 py-3">{player.age}</td>
                    <td className="px-4 py-3">{player.playerType}</td>
                    <td className="px-4 py-3">{player.mnumber}</td>
                    <td className="px-4 py-3">{player.aadhaar}</td>
                    <td className="px-4 py-3">{player.upiRefNo || "N/A"}</td>

                    {/* Payment Screenshot thumbnail */}
                    <td className="px-4 py-3">
                      {player.paymentScreenshot ? (
                        <img
                          src={player.paymentScreenshot}
                          alt="Payment SS"
                          className="w-12 h-12 rounded-lg border border-gray-600 object-cover"
                          onClick={(e) => {
                            e.stopPropagation();
                            const paymentWindow = window.open(player.paymentScreenshot, "_blank", "noopener,noreferrer");
                            if (paymentWindow) paymentWindow.opener = null;
                          }}
                        />
                      ) : (
                        "N/A"
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {player.photo ? (
                        <img
                          src={player.photo}
                          alt={player.name}
                          className="w-12 h-12 rounded-full border border-yellow-400 object-cover"
                        />
                      ) : (
                        "N/A"
                      )}
                    </td>

                    <td className="px-4 py-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleApprove(player)}
                        disabled={!canManageActiveTournament}
                        className="bg-green-500 hover:bg-green-400 text-black font-semibold px-3 py-1 rounded-md disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(player)}
                        disabled={!canManageActiveTournament}
                        className="bg-red-500 hover:bg-red-400 text-black font-semibold px-3 py-1 rounded-md disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </>
      )}
      <AlertModal
        open={Boolean(alert)}
        title={alert?.title}
        message={alert?.message}
        tone={alert?.tone}
        onClose={() => setAlert(null)}
      />
      <ConfirmModal
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        tone={confirmDialog?.tone}
        confirmText={confirmDialog?.confirmText}
        cancelText={confirmDialog?.cancelText}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={confirmDialog?.onCancel}
      />
    </div>
  );
}
