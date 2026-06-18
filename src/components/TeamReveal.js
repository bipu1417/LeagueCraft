import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { getDocs } from "../firebase";
import { useTournament } from "../context/TournamentContext";
import { getDataCollection } from "../utils/tournamentData";
import introMusic from "../assets/intro.mp3";
import teamBg from "../assets/team-bg.avif";

export default function TeamReveal() {
  const { activeTournament } = useTournament();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revealedTeams, setRevealedTeams] = useState([]);
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const loadTeams = async () => {
      if (!activeTournament) {
        setTeams([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setStarted(false);
      setIndex(0);
      setRevealedTeams([]);

      try {
        const snap = await getDocs(getDataCollection(activeTournament, "teamdetails"));
        const list = snap.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((a, b) => (a.teamName || "").localeCompare(b.teamName || ""));
        setTeams(list);
      } catch (err) {
        console.error("Unable to load reveal teams:", err);
        setError(err.code === "permission-denied" ? "You do not have permission to view teams." : err.message);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, [activeTournament]);

  const handleStart = () => {
    if (teams.length === 0) return;
    setStarted(true);

    // Initialize audio
    if (!audioRef.current) {
      audioRef.current = new Audio(introMusic);
      audioRef.current.volume = 0.4;
      audioRef.current.loop = true;
    }

    audioRef.current
      .play()
      .catch((err) => console.warn("Audio playback blocked:", err));
  };

  useEffect(() => {
    if (!started || index >= teams.length) return;

    const interval = setInterval(() => {
      setRevealedTeams((prev) => [...prev, teams[index]]);
      setIndex((prev) => prev + 1);
    }, 2500);

    return () => clearInterval(interval);
  }, [started, index, teams]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        const audio = audioRef.current;
        const fadeOut = setInterval(() => {
          if (audio.volume > 0.05) {
            audio.volume -= 0.05;
          } else {
            audio.pause();
            audio.currentTime = 0;
            clearInterval(fadeOut);
          }
        }, 100);
      }
    };
  }, []);

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 sm:px-6 md:px-10 text-center"
      style={{
        backgroundImage: `url(${teamBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 z-0"></div>

      {!started ? (
        // 🎯 Start Button
        <div className="z-10 flex flex-col items-center justify-center min-h-[70vh]">
          {activeTournament && (
            <div className="mb-8 max-w-3xl rounded-lg border border-yellow-300/30 bg-yellow-300/10 px-4 py-3 text-yellow-100">
              <p className="safe-text text-lg font-bold">{activeTournament.name}</p>
              <p className="text-sm text-yellow-50/80">{activeTournament.year} team reveal</p>
            </div>
          )}
          {loading ? (
            <p className="rounded-md border border-white/10 bg-gray-950/70 px-4 py-3 text-gray-200">
              Loading teams...
            </p>
          ) : error ? (
            <p className="max-w-xl rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-100">
              {error}
            </p>
          ) : teams.length === 0 ? (
            <p className="max-w-xl rounded-md border border-white/10 bg-gray-950/70 px-4 py-3 text-gray-200">
              No teams found for the selected tournament. Select another tournament from Profile or add teams first.
            </p>
          ) : (
          <>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="rounded-xl bg-yellow-400 px-8 py-4 text-xl font-bold text-black shadow-lg transition hover:bg-yellow-300 md:text-2xl"
          >
            Start Team Reveal
          </motion.button>
          <p className="mt-4 text-gray-300 text-sm sm:text-base">
            {teams.length} team{teams.length === 1 ? "" : "s"} ready to reveal.
          </p>
          </>
          )}
        </div>
      ) : (
        <>
          {/* Title */}
          <motion.h1
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1 }}
            className="z-10 mt-10 sm:mt-16 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-10 sm:mb-12 text-yellow-400 tracking-widest drop-shadow-[0_0_25px_rgba(255,255,0,0.6)] px-4"
          >
            {activeTournament?.name || "Registered Teams"} - {activeTournament?.year || ""}
          </motion.h1>

          {/* Teams Grid */}
          <div className="z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 px-4 sm:px-8 pb-28 w-full max-w-7xl">
            {revealedTeams.map((team, i) => (
              <motion.div
                key={team.id}
                initial={{ scale: 0, opacity: 0, rotateY: 180 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                transition={{ duration: 0.8, delay: i * 0.2, type: "spring" }}
                className="flex items-center justify-center text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white tracking-wide py-6 sm:py-8 px-6 rounded-2xl shadow-[0_0_30px_rgba(255,200,0,0.5)] bg-gradient-to-r from-yellow-500 to-orange-600 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,100,0.7)] transition-transform duration-300"
              >
                {team.teamName || team.name}
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
