import React, { useCallback, useEffect, useState } from "react";
import {
  db,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "../firebase";
import { useTournament } from "../context/TournamentContext";
import { getTournamentCollection } from "../utils/tournamentData";
import { getTeamPurse } from "../utils/teamUtils";

export default function TeamManager() {
  const [teams, setTeams] = useState([]);
  const [ownerName, setOwnerName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [phone, setPhone] = useState("");
  const [teamPurse, setTeamPurse] = useState("");
  const [logoBase64, setLogoBase64] = useState("");
  const [editingTeam, setEditingTeam] = useState(null);
  const [error, setError] = useState("");
  const { activeTournament, canManageActiveTournament } = useTournament();

  const fetchTeams = useCallback(async () => {
    if (!activeTournament) {
      setTeams([]);
      return;
    }
    try {
      const ref = getTournamentCollection(activeTournament.year, activeTournament.id, "teamdetails");
      const snap = await getDocs(ref);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTeams(list);
      setError("");
    } catch (err) {
      console.error("Unable to load teams:", err);
      setTeams([]);
      setError(err.code === "permission-denied"
        ? "You do not have permission to load teams. Complete premium payment and deploy Firestore rules."
        : err.message);
    }
  }, [activeTournament]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setLogoBase64(reader.result);
    reader.readAsDataURL(file);
  };

  const isTeamNameExists = (name) =>
    teams.some(
      (team) =>
        team.teamName.toLowerCase() === name.toLowerCase() &&
        team.id !== (editingTeam?.id || "")
    );

  const generateTeamId = () => {
    const timestamp = Date.now().toString().slice(-6);
    return "TEAM-" + new Date().getFullYear() + "-" + timestamp;
  };

  const handleSubmit = async () => {
    if (!canManageActiveTournament) {
      setError("Only the tournament creator with an active paid subscription can manage teams.");
      return;
    }

    if (!ownerName || !teamName || !phone || !teamPurse) {
      setError("All fields are required");
      return;
    }

    if (isTeamNameExists(teamName)) {
      setError("Team name already exists");
      return;
    }

    setError("");
    const normalizedPurse = Number(teamPurse);

    if (editingTeam) {
      const ref = doc(db, "years", String(activeTournament.year), "tournaments", activeTournament.id, "teamdetails", editingTeam.id);
      await updateDoc(ref, {
        ownerName,
        teamName,
        phone,
        teamPurse: normalizedPurse,
        purse: normalizedPurse,
        logoBase64,
      });
    } else {
      const ref = getTournamentCollection(activeTournament.year, activeTournament.id, "teamdetails");
      await addDoc(ref, {
        ownerName,
        teamName,
        phone,
        teamPurse: normalizedPurse,
        purse: normalizedPurse,
        logoBase64,
        teamUniqueId: generateTeamId(),
      });
    }

    resetForm();
    fetchTeams();
  };

  const resetForm = () => {
    setOwnerName("");
    setTeamName("");
    setPhone("");
    setTeamPurse("");
    setLogoBase64("");
    setEditingTeam(null);
    setError("");
  };

  const handleDelete = async (id) => {
    if (!canManageActiveTournament) {
      setError("Only the tournament creator with an active paid subscription can delete teams.");
      return;
    }

    await deleteDoc(doc(db, "years", String(activeTournament.year), "tournaments", activeTournament.id, "teamdetails", id));
    fetchTeams();
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setOwnerName(team.ownerName);
    setTeamName(team.teamName);
    setPhone(team.phone);
    setTeamPurse(String(getTeamPurse(team)));
    setLogoBase64(team.logoBase64);
  };

  return (
    <div className="min-h-screen bg-gray-900 px-0 py-4 text-white sm:px-4 sm:py-10">
      {!activeTournament && (
        <div className="max-w-3xl mx-auto bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
          <h1 className="text-xl font-bold text-yellow-300">Select a tournament first</h1>
        </div>
      )}
      {activeTournament && (
      <>
      {!canManageActiveTournament && (
        <div className="mx-auto mb-6 max-w-3xl rounded-lg border border-yellow-300/30 bg-yellow-300/10 p-4 text-yellow-100">
          This tournament is read-only for you. Only the creator of this tournament with an active paid subscription can add, edit, or delete teams.
        </div>
      )}
      {/* FORM */}
      <div className={`max-w-3xl mx-auto bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 sm:p-6 ${!canManageActiveTournament ? "opacity-75" : ""}`}>
        <h1 className="text-xl font-bold text-yellow-400 mb-4 sm:text-2xl">
          {editingTeam ? "Edit Team" : "Create Team"}
        </h1>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Owner Name"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            disabled={!canManageActiveTournament}
            className="w-full bg-gray-700 px-3 py-2 rounded-md outline-none"
          />
          <input
            type="text"
            placeholder="Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            disabled={!canManageActiveTournament}
            className="w-full bg-gray-700 px-3 py-2 rounded-md outline-none"
          />
          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={!canManageActiveTournament}
            className="w-full bg-gray-700 px-3 py-2 rounded-md outline-none"
          />
          <input
            type="number"
            placeholder="Team Purse (₹)"
            value={teamPurse}
            onChange={(e) => setTeamPurse(e.target.value)}
            disabled={!canManageActiveTournament}
            className="w-full bg-gray-700 px-3 py-2 rounded-md outline-none"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            disabled={!canManageActiveTournament}
            className="w-full rounded-md bg-gray-700 px-3 py-2 text-sm"
          />

          {logoBase64 && (
            <img
              src={logoBase64}
              className="w-24 h-24 mt-3 rounded-md border border-gray-600 object-cover"
              alt="Team Logo"
            />
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!canManageActiveTournament}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-md"
          >
            {editingTeam ? "Update Team" : "Create Team"}
          </button>

          {editingTeam && (
            <button
              onClick={resetForm}
              className="w-full bg-gray-600 mt-2 text-white px-4 py-2 rounded-md"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* TEAM LIST */}
      <div className="max-w-5xl mx-auto mt-8 bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 sm:mt-10 sm:p-6">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">Team List</h2>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block overflow-x-auto">
          <table className="responsive-table text-left">
            <thead>
              <tr className="text-yellow-400 border-b border-gray-700">
                <th className="py-2">Logo</th>
                <th>Team ID</th>
                <th>Owner</th>
                <th>Team Name</th>
                <th>Phone</th>
                <th>Purse (₹)</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {teams.map((team) => (
                <tr key={team.id} className="border-b border-gray-700">
                  <td className="py-3">
                    {team.logoBase64 ? (
                      <img
                        alt="logo"
                        src={team.logoBase64}
                        loading="lazy"
                        decoding="async"
                        className="w-12 h-12 rounded-md object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-700 rounded-md flex items-center justify-center">
                        ❌
                      </div>
                    )}
                  </td>
                  <td className="break-all text-gray-300">{team.teamUniqueId}</td>
                  <td>{team.ownerName}</td>
                  <td>{team.teamName}</td>
                  <td>{team.phone}</td>
                  <td className="font-semibold text-green-300">{getTeamPurse(team)}</td>
                  <td className="space-x-3">
                    {canManageActiveTournament ? (
                    <>
                    <button
                      onClick={() => handleEdit(team)}
                      className="text-blue-400 underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(team.id)}
                      className="text-red-400 underline"
                    >
                      Delete
                    </button>
                    </>
                    ) : (
                      <span className="text-gray-500">Read-only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW */}
        <div className="md:hidden space-y-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-gray-700 p-4 rounded-xl shadow-md flex flex-col gap-2"
            >
              <div className="flex items-center gap-3">
                {team.logoBase64 ? (
                  <img
                    src={team.logoBase64}
                    alt="logo"
                    loading="lazy"
                    decoding="async"
                    className="w-16 h-16 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-600 rounded-md flex items-center justify-center">
                    ❌
                  </div>
                )}
                <div className="min-w-0">
                  <p className="safe-text text-yellow-300 font-bold">{team.teamName}</p>
                  <p className="break-all text-xs text-gray-300">{team.teamUniqueId}</p>
                </div>
              </div>

              <p className="safe-text">Owner: {team.ownerName}</p>
              <p className="safe-text">Phone: {team.phone}</p>
              <p className="text-green-300 font-semibold">
                💰 Purse: ₹{getTeamPurse(team)}
              </p>

              <div className="flex flex-wrap gap-4 mt-2">
                {canManageActiveTournament ? (
                <>
                <button
                  onClick={() => handleEdit(team)}
                  className="text-blue-400 underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(team.id)}
                  className="text-red-400 underline"
                >
                  Delete
                </button>
                </>
                ) : (
                  <span className="text-sm text-gray-400">Read-only</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
