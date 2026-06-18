import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, IndianRupee, ShieldCheck, Trophy } from "lucide-react";
import heroImage from "../assets/leaguecraft-bg.svg";
import leagueCraftLogo from "../assets/leaguecraft-logo.svg";
import { useTournament } from "../context/TournamentContext";
import { getRegistrationStatus } from "../utils/tournamentData";

const getOrdinal = (day) => {
  if (day > 3 && day < 21) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
};

const formatRegistrationRange = (startValue, endValue) => {
  if (!startValue || !endValue) return "";

  const start = new Date(startValue);
  const end = new Date(endValue);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "";
  }

  const month = new Intl.DateTimeFormat("en-GB", { month: "long" });
  const startDay = getOrdinal(start.getDate());
  const endDay = getOrdinal(end.getDate());
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    return `${startDay} - ${endDay} ${month.format(end)} ${end.getFullYear()}`;
  }

  return `${startDay} ${month.format(start)} ${start.getFullYear()} - ${endDay} ${month.format(end)} ${end.getFullYear()}`;
};

const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-IN")}/-`;

const Home = () => {
  const today = new Date();
  const { activeTournament } = useTournament();
  const [countdown, setCountdown] = useState("");
  const startDate = React.useMemo(() => new Date(2025, 10, 15), []);
  const endDate = React.useMemo(() => new Date(2025, 10, 26, 16, 59, 59), []);
  const selectedRegistration = getRegistrationStatus(activeTournament);
  const registrationRange = activeTournament
    ? formatRegistrationRange(activeTournament.registrationStart, activeTournament.registrationEnd)
    : "";
  const totalPrize = activeTournament
    ? Number(activeTournament.winnerPrize || 0) + Number(activeTournament.runnerUpPrize || 0)
    : 0;
  const heroTitle = activeTournament
    ? `Welcome to ${activeTournament.name}`
    : "Welcome to LeagueCraft";
  const heroBadge = activeTournament
    ? `${activeTournament.name} ${activeTournament.year}`
    : "LeagueCraft";

  const isRegistrationOpen = today >= startDate && today <= endDate;
  const isRegistrationClosed = today > endDate;

  const formattedEndDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(endDate);
  }, [endDate]);

  useEffect(() => {
    if (!isRegistrationOpen) return undefined;

    const update = () => {
      const distance = endDate.getTime() - Date.now();

      if (distance <= 0) {
        setCountdown("Less than an hour left");
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((distance / (1000 * 60)) % 60);
      const parts = [];
      if (days) parts.push(`${days}d`);
      if (hours) parts.push(`${hours}h`);
      if (minutes) parts.push(`${minutes}m`);

      setCountdown(parts.join(" "));
    };

    update();
    const timer = setInterval(update, 60 * 1000);
    return () => clearInterval(timer);
  }, [endDate, isRegistrationOpen]);

  return (
    <div className="space-y-6 sm:space-y-10">
      <section className="relative min-h-[calc(100vh-7rem)] overflow-hidden rounded-lg border border-white/10 bg-gray-950">
        <img
          src={heroImage}
          alt="LeagueCraft arena background"
          className="absolute inset-0 h-full w-full object-cover opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/82 via-gray-950/38 to-gray-950/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 via-transparent to-gray-950/20" />

        <div className="relative z-10 flex min-h-[calc(100vh-7rem)] flex-col justify-between p-4 sm:p-8 lg:p-10">
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[40rem]">
            <div className="surface rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CalendarDays size={18} className="text-yellow-300" />
                Tournament Dates
              </div>
              <p className="safe-text mt-2 text-xl font-bold text-yellow-200 sm:text-2xl">
                {registrationRange || "Select tournament"}
              </p>
            </div>
            <div className="surface rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <IndianRupee size={18} className="text-green-300" />
                Prizes Worth
              </div>
              <p className="safe-text mt-2 text-xl font-bold text-green-200 sm:text-2xl">
                {totalPrize ? formatCurrency(totalPrize) : "Add prize details"}
              </p>
              {activeTournament && totalPrize > 0 && (
                <p className="mt-1 text-xs text-gray-300">
                  Winner {formatCurrency(activeTournament.winnerPrize)} • Runner-up {formatCurrency(activeTournament.runnerUpPrize)}
                </p>
              )}
            </div>
          </div>

          <div className="max-w-3xl py-8 sm:py-12">
            <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-md border border-yellow-300/30 bg-yellow-300/10 px-3 py-2 text-sm font-medium text-yellow-100">
              {activeTournament ? (
                <Trophy size={17} />
              ) : (
                <img src={leagueCraftLogo} alt="" className="h-6 w-6 rounded-md" />
              )}
              <span className="truncate">{heroBadge}</span>
            </div>
            <h1 className="safe-text text-3xl font-black tracking-normal text-white sm:text-5xl lg:text-6xl">
              {heroTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-200 sm:text-lg">
              {registrationRange ? (
                <>
                  Register for the upcoming season between{" "}
                  <span className="font-semibold text-yellow-200">{registrationRange}</span>.
                </>
              ) : (
                "Select a tournament to view registration dates, teams, players and auction details."
              )}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              {activeTournament ? (
                selectedRegistration.isOpen ? (
                  <Link
                    to="/registration"
                    className="inline-flex w-full items-center justify-center rounded-md bg-yellow-400 px-6 py-3 font-bold text-gray-950 shadow-lg shadow-yellow-500/20 hover:bg-yellow-300 sm:w-auto"
                  >
                    Register Now
                  </Link>
                ) : (
                  <button
                    disabled
                    className="inline-flex w-full items-center justify-center rounded-md bg-gray-600 px-6 py-3 font-bold text-gray-300 sm:w-auto"
                  >
                    {selectedRegistration.isFuture ? "Coming Soon" : "Registration Closed"}
                  </button>
                )
              ) : isRegistrationOpen ? (
                <Link
                  to="/registration"
                  className="inline-flex w-full items-center justify-center rounded-md bg-yellow-400 px-6 py-3 font-bold text-gray-950 shadow-lg shadow-yellow-500/20 hover:bg-yellow-300 sm:w-auto"
                >
                  Register Now
                </Link>
              ) : (
                <button
                  disabled
                  className="inline-flex w-full items-center justify-center rounded-md bg-gray-600 px-6 py-3 font-bold text-gray-300 sm:w-auto"
                >
                  Registration Closed
                </button>
              )}

              <div className="safe-text w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200 sm:w-auto">
                {activeTournament ? (
                  <>
                    Registration:{" "}
                    <span className={selectedRegistration.isOpen ? "font-semibold text-green-300" : "font-semibold text-yellow-200"}>
                      {selectedRegistration.label}
                    </span>
                  </>
                ) : (
                  <>
                    Last day: <span className="font-semibold text-yellow-200">{formattedEndDate}</span>
                    {isRegistrationOpen ? (
                      <span className="ml-2 text-green-300">Open ({countdown || "ending soon"})</span>
                    ) : isRegistrationClosed ? (
                      <span className="ml-2 text-red-300">Closed</span>
                    ) : (
                      <span className="ml-2 text-gray-300">Opens {startDate.toLocaleDateString()}</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-white/10 bg-gray-950/70 px-4 py-3">
            <div className="animate-scroll whitespace-nowrap text-sm font-semibold text-yellow-100 sm:text-base">
              <span className="mr-10">অপেক্ষার অবসান! শুরু হতে চলেছে বহু প্রতীক্ষিত ম্যাচ ডে.</span>
              <span className="mr-10">Cricket madness returns to the field. Do not miss the match day energy.</span>
              <span className="mr-10 inline-flex items-center gap-2"><ShieldCheck size={16} /> Registrations, teams and auctions in one workspace.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-gray-950/70 p-4 sm:p-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-yellow-200">LeagueCraft archive</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Tournament history and committee</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
              View PPL history, past winners, sponsors, and committee details on the dedicated about page.
            </p>
          </div>
          <Link
            to="/about"
            className="inline-flex w-full items-center justify-center rounded-md bg-white/10 px-4 py-2 font-semibold text-yellow-100 hover:bg-white/15 sm:w-auto"
          >
            Open About Page
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
