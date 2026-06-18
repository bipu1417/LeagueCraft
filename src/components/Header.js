import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  ClipboardCheck,
  Gavel,
  Home,
  LogIn,
  LogOut,
  Menu,
  Network,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserCircle,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTournament } from "../context/TournamentContext";
import leagueCraftLogo from "../assets/leaguecraft-logo.svg";

export default function Header({ isAdmin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isCreator, logout } = useAuth();
  const { activeTournament, canManageActiveTournament } = useTournament();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate("/");
  };

  const linkClass = (path) =>
    `inline-flex whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
      location.pathname === path
        ? "bg-yellow-400 text-gray-950"
        : "text-gray-200 hover:bg-white/10 hover:text-yellow-200"
    }`;

  const mobileLinkClass = (path) =>
    `inline-flex h-12 w-12 items-center justify-center rounded-lg border text-sm transition ${
      location.pathname === path
        ? "border-yellow-300 bg-yellow-400 text-gray-950 shadow-lg shadow-yellow-500/20"
        : "border-white/10 bg-white/5 text-gray-200 hover:border-yellow-300/50 hover:bg-white/10 hover:text-yellow-200"
    }`;

  const mobileDisabledClass =
    "inline-flex h-12 w-12 items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] text-gray-600";

  const closeMenu = () => setMenuOpen(false);

  const navItems = [
    { to: "/", label: "Home", icon: Home, show: true },
    { to: "/profile", label: "Profile", icon: UserCircle, show: !!user },
    { to: "/tournaments", label: "Tournaments", icon: Trophy, show: !!user },
    { to: "/auction", label: "Auction", icon: Gavel, show: !!user },
    { to: "/fixtures", label: "Fixtures", icon: Network, show: !!user && !!activeTournament },
    { to: "/teams", label: "Teams", icon: Users, show: !!user },
    { to: "/subscription-approvals", label: "Subscriptions", icon: BadgeCheck, show: !!isCreator },
    { to: "/registered-players", label: "Players", icon: UsersRound, show: !!user },
    { to: "/team-reveal", label: "Team Reveal", icon: Sparkles, show: !!user },
    { to: "/manage-tournaments", label: "Manage", icon: Settings, show: !!isAdmin },
    {
      to: "/create-team",
      label: "Manage Teams",
      icon: Users,
      show: !!isAdmin && !!canManageActiveTournament,
    },
    {
      to: "/pending-approval",
      label: "Approvals",
      icon: ClipboardCheck,
      show: !!isAdmin && !!canManageActiveTournament,
    },
  ].filter((item) => item.show);

  const desktopLinks = (
    <>
      {navItems.map((item) =>
        item.disabled ? (
          <span key={item.to} title={item.title} className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-gray-500">
            {item.label}
          </span>
        ) : (
          <Link key={item.to} to={item.to} onClick={closeMenu} className={linkClass(item.to)}>
            {item.label}
          </Link>
        )
      )}

      {!user ? (
        <Link to="/login" onClick={closeMenu} className="inline-flex whitespace-nowrap rounded-md bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-950 hover:bg-yellow-300">
          Login
        </Link>
      ) : (
        <button onClick={handleLogout} className="inline-flex whitespace-nowrap items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-200 hover:bg-red-500/10">
          <LogOut size={16} />
          Logout
        </button>
      )}
    </>
  );

  const mobileLinks = (
    <>
      {navItems.map(({ to, label, icon: Icon, disabled, title }) =>
        disabled ? (
          <span key={to} title={title} aria-label={title} className={mobileDisabledClass}>
            <Icon size={21} aria-hidden="true" />
          </span>
        ) : (
          <Link key={to} to={to} onClick={closeMenu} className={mobileLinkClass(to)} title={label} aria-label={label}>
            <Icon size={21} aria-hidden="true" />
          </Link>
        )
      )}

      {!user ? (
        <Link
          to="/login"
          onClick={closeMenu}
          className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-400 text-gray-950 shadow-lg shadow-yellow-500/20 hover:bg-yellow-300"
          title="Login"
          aria-label="Login"
        >
          <LogIn size={21} aria-hidden="true" />
        </Link>
      ) : (
        <button
          onClick={handleLogout}
          className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-red-300/20 bg-red-500/10 text-red-200 hover:bg-red-500/20"
          title="Logout"
          aria-label="Logout"
        >
          <LogOut size={21} aria-hidden="true" />
        </button>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/88 text-white shadow-xl backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 md:px-6">
        <Link to="/" className="order-1 flex min-w-0 max-w-[15rem] flex-shrink-0 items-center gap-3 sm:max-w-[17rem] xl:max-w-[19rem]">
          <img
            src={leagueCraftLogo}
            alt="LeagueCraft"
            className="h-11 w-11 flex-none rounded-lg shadow-lg shadow-yellow-500/20"
          />
          <span className="min-w-0">
            <span className="block truncate text-base font-bold leading-tight text-yellow-200 sm:text-lg">LeagueCraft</span>
            <span className="hidden truncate text-xs text-gray-400 xl:block">Registration, teams and auction workspace</span>
          </span>
        </Link>

        {activeTournament && (
          <div className="order-3 hidden min-w-0 max-w-full items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300 lg:flex xl:order-2 xl:max-w-[18rem] 2xl:max-w-[24rem]">
            <ShieldCheck size={15} className="flex-none text-green-300" />
            <span className="min-w-0 truncate text-yellow-200">{activeTournament.name}</span>
            <span className="flex-none">{activeTournament.year}</span>
          </div>
        )}

        <nav className="order-4 hidden w-full min-w-0 flex-wrap items-center justify-end gap-1 md:flex xl:order-3 xl:ml-auto xl:w-auto xl:flex-1">
          {desktopLinks}
        </nav>

        <button
          className="order-2 ml-auto rounded-md border border-white/10 bg-white/5 p-2 text-yellow-200 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <nav className="grid grid-cols-[repeat(auto-fit,minmax(3rem,1fr))] justify-items-center gap-3 border-t border-white/10 bg-gray-950/95 px-4 py-4 md:hidden">
          {mobileLinks}
        </nav>
      )}
    </header>
  );
}
