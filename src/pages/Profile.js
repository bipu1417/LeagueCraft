import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, PlusCircle, ShieldCheck, Trophy } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTournament } from "../context/TournamentContext";

export default function Profile() {
  const {
    user,
    profile,
    effectiveRole,
    isSubscribed,
    isSubscriptionPending,
    isSubscriptionRejected,
    isSubscriptionExpired,
    subscriptionExpiresAt,
    subscriptionDaysRemaining,
    logout,
  } = useAuth();
  const { tournaments, activeTournament, selectTournament } = useTournament();
  const navigate = useNavigate();
  const profileTournaments = effectiveRole === "admin"
    ? tournaments.filter((tournament) =>
        !tournament.isLegacy &&
        (tournament.ownerId === user?.uid || tournament.ownerEmail === user?.email)
      )
    : [];
  const activeProfileTournament = profileTournaments.find((tournament) => tournament.id === activeTournament?.id);

  const name = [profile?.firstname || profile?.firstName, profile?.lastname || profile?.lastName]
    .filter(Boolean)
    .join(" ") || user?.email;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-[75vh] px-0 py-4 text-white sm:px-4 sm:py-8">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-6">
        <section className="surface rounded-lg p-6">
          <div className="h-16 w-16 rounded-lg bg-yellow-400 text-gray-950 flex items-center justify-center text-2xl font-bold shadow-lg shadow-yellow-500/20">
            {name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <h1 className="safe-text text-2xl font-bold text-white mt-4">{name}</h1>
          <p className="break-all text-gray-300">{user?.email}</p>
          {(profile?.phone || profile?.subscription?.contactPhone) && (
            <p className="break-all text-gray-300">{profile.phone || profile.subscription.contactPhone}</p>
          )}
          <p className="text-sm text-gray-400 mt-2">Role: {effectiveRole || "user"}</p>

          <div className="mt-5 rounded-md bg-gray-950/70 border border-white/10 p-4">
            <p className="text-sm text-gray-400">Subscription</p>
            <p className={isSubscribed ? "text-green-300 font-semibold" : isSubscriptionPending ? "text-yellow-200 font-semibold" : "text-red-300 font-semibold"}>
              {isSubscribed && <ShieldCheck size={17} className="mr-1 inline" />}
              {isSubscribed
                ? `Premium active for organizer tools (${subscriptionDaysRemaining} day${subscriptionDaysRemaining === 1 ? "" : "s"} left)`
                : isSubscriptionPending
                  ? "Pending verification"
                  : isSubscriptionRejected
                    ? "Subscription rejected: read-only access"
                    : isSubscriptionExpired
                      ? "Premium expired: renew to manage tournaments"
                      : "Free account: read-only access"}
            </p>
            {subscriptionExpiresAt && (
              <p className="mt-2 text-sm text-gray-300">
                Valid until: {subscriptionExpiresAt.toLocaleString()}
              </p>
            )}
            {isSubscriptionRejected && profile?.subscription?.rejectionReason && (
              <p className="mt-2 text-sm text-red-100">{profile.subscription.rejectionReason}</p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={isSubscribed ? "/manage-tournaments" : "/subscription"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-yellow-400 px-4 py-2 font-semibold text-gray-950 hover:bg-yellow-300 sm:w-auto"
            >
              <PlusCircle size={18} />
              {isSubscribed
                ? "Manage Tournaments"
                : isSubscriptionPending
                  ? "Pending Verification"
                  : isSubscriptionExpired
                    ? "Renew Premium"
                    : isSubscriptionRejected
                      ? "Resubmit Premium"
                      : "Buy Premium"}
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-white/10 px-4 py-2 text-white hover:bg-white/15 sm:w-auto"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </section>

        <section className="surface rounded-lg p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-white"><Trophy size={20} className="text-yellow-300" /> Your Tournament Workspace</h2>
          <p className="text-sm text-gray-400 mt-1">
            Profile only shows tournaments connected to your organizer account. All hosted tournaments are available from the Tournaments page.
          </p>

          {activeProfileTournament ? (
            <div className="mt-5 rounded-md bg-gray-950/70 border border-white/10 p-4">
              <p className="text-sm text-gray-400">Active tournament</p>
              <p className="safe-text text-lg font-semibold">{activeProfileTournament.name}</p>
              <p className="text-sm text-gray-300">{activeProfileTournament.year} • {activeProfileTournament.sport}</p>
            </div>
          ) : (
            <div className="mt-5 rounded-md bg-gray-950/70 border border-white/10 p-4 text-gray-300">
              {effectiveRole === "admin"
                ? "No tournament from your organizer account is selected yet."
                : "No organizer tournaments are linked to this account."}
            </div>
          )}

          <div className="mt-5 space-y-3">
            {profileTournaments.map((tournament) => (
              <button
                key={tournament.id}
                onClick={() => selectTournament(tournament.id)}
                className={`w-full text-left rounded-md border px-4 py-3 ${
                  activeTournament?.id === tournament.id
                    ? "border-yellow-400 bg-yellow-400/10"
                    : "border-white/10 bg-gray-950/70 hover:border-white/30"
                }`}
              >
                <span className="block font-semibold">{tournament.name}</span>
                <span className="text-sm text-gray-400">{tournament.year}</span>
              </button>
            ))}
            {profileTournaments.length === 0 && (
              <Link
                to="/tournaments"
                className="inline-flex w-full items-center justify-center rounded-md bg-white/10 px-4 py-3 font-semibold hover:bg-white/15"
              >
                View Hosted Tournaments
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
