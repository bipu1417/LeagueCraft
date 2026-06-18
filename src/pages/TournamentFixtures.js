import React, { useEffect, useMemo, useState } from "react";
import { db, doc, getDoc, getDocs, serverTimestamp, setDoc } from "../firebase";
import { useTournament } from "../context/TournamentContext";
import { getDataCollection } from "../utils/tournamentData";

const numberToGroupName = (index) => String.fromCharCode(65 + index);

const makeGroups = (teams, groupCount) => {
  const groups = Array.from({ length: groupCount }, (_, index) => ({
    id: numberToGroupName(index),
    name: `Group ${numberToGroupName(index)}`,
    teams: [],
  }));

  teams.forEach((team, index) => {
    groups[index % groupCount].teams.push(team);
  });

  return groups;
};

const makeGroupFixtures = (groups) =>
  groups.flatMap((group) => {
    const fixtures = [];
    for (let i = 0; i < group.teams.length; i += 1) {
      for (let j = i + 1; j < group.teams.length; j += 1) {
        fixtures.push({
          group: group.name,
          home: group.teams[i],
          away: group.teams[j],
        });
      }
    }
    return fixtures;
  });

const getRoundName = (matchCount) => {
  if (matchCount === 1) return "Final";
  if (matchCount === 2) return "Semi Finals";
  if (matchCount === 4) return "Quarter Finals";
  return `Round of ${matchCount * 2}`;
};

const getTeamLabel = (team) => team?.teamName || team?.name || "Team";

const getFixtureDocRef = (tournament) => {
  if (!tournament) return null;
  if (tournament.isLegacy) {
    return doc(db, "fixtures", tournament.id);
  }

  return doc(db, "years", String(tournament.year), "tournaments", tournament.id, "fixtures", "setup");
};

const getEntrantLabel = (entrant) => {
  if (!entrant) return "TBD";
  if (entrant.team) return getTeamLabel(entrant.team);
  return entrant.label || "TBD";
};

const getEntrantMeta = (entrant) => {
  if (!entrant?.groupName) return "";
  return `${entrant.groupName} Rank ${entrant.rank}`;
};

const serializeTeam = (team) => ({
  id: team?.id || "",
  name: getTeamLabel(team),
  teamUniqueId: team?.teamUniqueId || "",
});

const serializeEntrant = (entrant) => ({
  team: entrant?.team ? serializeTeam(entrant.team) : null,
  label: entrant?.label || "",
  groupId: entrant?.groupId || "",
  groupName: entrant?.groupName || "",
  rank: entrant?.rank || null,
});

const serializeGroups = (groups) =>
  groups.map((group) => ({
    id: group.id,
    name: group.name,
    teams: group.teams.map(serializeTeam),
  }));

const serializeGroupFixtures = (fixtures) =>
  fixtures.map((fixture, index) => ({
    id: `group-${index + 1}`,
    group: fixture.group,
    home: serializeTeam(fixture.home),
    away: serializeTeam(fixture.away),
  }));

const serializeKnockoutRounds = (rounds) =>
  rounds.map((round) => ({
    name: round.name,
    matches: round.matches.map((match, index) => ({
      id: match.id,
      matchNumber: index + 1,
      home: serializeEntrant(match.home),
      away: serializeEntrant(match.away),
      selectedWinnerId: match.selectedWinnerId || "",
      winner: match.selectedWinnerId
        ? serializeTeam(match.options.find((entrant) => entrant.team.id === match.selectedWinnerId)?.team)
        : null,
    })),
  }));

const buildSeededQualifiers = (groups, qualifiersPerGroup, standings) =>
  groups.flatMap((group) =>
    group.teams
      .map((team, index) => ({
        team,
        groupId: group.id,
        groupName: group.name,
        rank: Number(standings[team.id] || index + 1),
      }))
      .sort((a, b) => a.rank - b.rank || getTeamLabel(a.team).localeCompare(getTeamLabel(b.team)))
      .slice(0, qualifiersPerGroup)
  );

const buildCrossGroupMatches = (qualifiers) => {
  const remaining = [...qualifiers].sort((a, b) => a.rank - b.rank);
  const matches = [];

  while (remaining.length > 1) {
    const top = remaining.shift();
    let opponentIndex = -1;

    for (let index = remaining.length - 1; index >= 0; index -= 1) {
      if (remaining[index].groupId !== top.groupId) {
        opponentIndex = index;
        break;
      }
    }

    if (opponentIndex === -1) {
      opponentIndex = remaining.length - 1;
    }

    const bottom = remaining.splice(opponentIndex, 1)[0];
    matches.push({ home: top, away: bottom });
  }

  return matches;
};

const buildKnockoutRounds = (qualifiers, winners) => {
  const findWinnerEntrant = (match, teamId) =>
    [match.home, match.away].find((entrant) => entrant?.team?.id === teamId);
  const firstRound = buildCrossGroupMatches(qualifiers);
  const rounds = [];
  let previousRoundMatches = firstRound.map((match, index) => ({
    id: `r0-m${index}`,
    home: match.home,
    away: match.away,
  }));
  rounds.push({
    name: getRoundName(previousRoundMatches.length),
    matches: previousRoundMatches,
  });

  let roundIndex = 1;
  while (previousRoundMatches.length > 1) {
    const sourceMatches = previousRoundMatches;
    const currentRoundIndex = roundIndex;
    const nextMatchCount = Math.ceil(sourceMatches.length / 2);
    const nextRoundMatches = Array.from({ length: nextMatchCount }, (_, index) => {
      const homeSource = sourceMatches[index * 2];
      const awaySource = sourceMatches[index * 2 + 1];
      const homeWinnerId = homeSource ? winners[homeSource.id] : "";
      const awayWinnerId = awaySource ? winners[awaySource.id] : "";

      return {
        id: `r${currentRoundIndex}-m${index}`,
        home: homeWinnerId
          ? findWinnerEntrant(homeSource, homeWinnerId)
          : { label: `Winner ${index * 2 + 1}` },
        away: awayWinnerId
          ? findWinnerEntrant(awaySource, awayWinnerId)
          : { label: `Winner ${index * 2 + 2}` },
      };
    });

    rounds.push({
      name: getRoundName(nextMatchCount),
      matches: nextRoundMatches,
    });
    previousRoundMatches = nextRoundMatches;
    roundIndex += 1;
  }

  return rounds.map((round) => ({
    ...round,
    matches: round.matches.map((match) => ({
      ...match,
      options: [match.home, match.away].filter((entrant) => entrant?.team?.id),
      selectedWinnerId: winners[match.id] || "",
    })),
  }));
};

export default function TournamentFixtures() {
  const { activeTournament, canManageActiveTournament } = useTournament();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [groupCount, setGroupCount] = useState(2);
  const [qualifiersPerGroup, setQualifiersPerGroup] = useState(2);
  const [standings, setStandings] = useState({});
  const [knockoutWinners, setKnockoutWinners] = useState({});
  const [fixtureLoading, setFixtureLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const loadTeams = async () => {
      if (!activeTournament) {
        setTeams([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const snap = await getDocs(getDataCollection(activeTournament, "teamdetails"));
        const list = snap.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((a, b) => getTeamLabel(a).localeCompare(getTeamLabel(b)));
        setTeams(list);
      } catch (err) {
        console.error("Unable to load fixture teams:", err);
        setError(err.code === "permission-denied" ? "You do not have permission to view teams." : err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, [activeTournament]);

  useEffect(() => {
    const loadFixtureSetup = async () => {
      if (!activeTournament) {
        setFixtureLoading(false);
        return;
      }

      setFixtureLoading(true);
      setSaveMessage("");
      try {
        const ref = getFixtureDocRef(activeTournament);
        const snap = ref ? await getDoc(ref) : null;
        if (snap?.exists()) {
          const data = snap.data();
          setGroupCount(Number(data.groupCount || 2));
          setQualifiersPerGroup(Number(data.qualifiersPerGroup || 2));
          setStandings(data.standings || {});
          setKnockoutWinners(data.knockoutWinners || {});
        } else {
          setGroupCount(2);
          setQualifiersPerGroup(2);
          setStandings({});
          setKnockoutWinners({});
        }
      } catch (err) {
        console.error("Unable to load fixture setup:", err);
        setSaveMessage(err.code === "permission-denied"
          ? "Fixture setup could not be loaded for this tournament."
          : err.message);
      } finally {
        setFixtureLoading(false);
      }
    };

    loadFixtureSetup();
  }, [activeTournament]);

  const maxGroups = Math.max(1, Math.min(8, teams.length || 1));
  const normalizedGroupCount = Math.min(groupCount, maxGroups);
  const groups = useMemo(
    () => makeGroups(teams, normalizedGroupCount),
    [teams, normalizedGroupCount]
  );
  const smallestGroupSize = Math.min(...groups.map((group) => group.teams.length || 0));
  const maxQualifiers = Math.max(1, smallestGroupSize || 1);
  const normalizedQualifiers = Math.min(qualifiersPerGroup, maxQualifiers);
  const groupFixtures = useMemo(() => makeGroupFixtures(groups), [groups]);
  const qualifiers = useMemo(
    () => buildSeededQualifiers(groups, normalizedQualifiers, standings),
    [groups, normalizedQualifiers, standings]
  );
  const knockoutRounds = useMemo(
    () => buildKnockoutRounds(qualifiers, knockoutWinners),
    [knockoutWinners, qualifiers]
  );
  const canGenerateKnockout = qualifiers.length >= 2;

  useEffect(() => {
    if (teams.length === 0) return;
    setGroupCount((current) => Math.min(current, maxGroups));
  }, [maxGroups, teams.length]);

  useEffect(() => {
    if (teams.length === 0) return;
    setQualifiersPerGroup((current) => Math.min(current, maxQualifiers));
  }, [maxQualifiers, teams.length]);

  const handleStandingChange = (teamId, value) => {
    if (!canManageActiveTournament) return;
    setStandings((current) => ({
      ...current,
      [teamId]: value,
    }));
    setKnockoutWinners({});
  };

  const handleWinnerChange = (matchId, teamId) => {
    if (!canManageActiveTournament) return;
    setKnockoutWinners((current) => {
      const next = {};
      const changedRoundIndex = Number(matchId.match(/^r(\d+)-/)?.[1] || 0);

      Object.entries(current).forEach(([key, value]) => {
        const roundIndex = Number(key.match(/^r(\d+)-/)?.[1] || 0);
        if (roundIndex <= changedRoundIndex && key !== matchId) {
          next[key] = value;
        }
      });

      if (teamId) {
        next[matchId] = teamId;
      }

      return next;
    });
  };

  const handleGroupCountChange = (value) => {
    if (!canManageActiveTournament) return;
    setGroupCount(value);
    setKnockoutWinners({});
  };

  const handleQualifiersChange = (value) => {
    if (!canManageActiveTournament) return;
    setQualifiersPerGroup(value);
    setKnockoutWinners({});
  };

  const saveFixtureSetup = async () => {
    if (!activeTournament || !canManageActiveTournament) return;

    setSaving(true);
    setSaveMessage("");
    try {
      await setDoc(getFixtureDocRef(activeTournament), {
        tournamentId: activeTournament.id,
        tournamentYear: activeTournament.year || null,
        groupCount: normalizedGroupCount,
        qualifiersPerGroup: normalizedQualifiers,
        standings,
        knockoutWinners,
        groups: serializeGroups(groups),
        groupFixtures: serializeGroupFixtures(groupFixtures),
        knockoutRounds: serializeKnockoutRounds(knockoutRounds),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setSaveMessage("Fixture setup saved for this tournament.");
    } catch (err) {
      console.error("Unable to save fixture setup:", err);
      setSaveMessage(err.code === "permission-denied"
        ? "Only the tournament creator with an active subscription can save fixtures."
        : err.message);
    } finally {
      setSaving(false);
    }
  };

  const ruleOptions = [
    { value: 1, label: "Top 1 from each group" },
    { value: 2, label: "Top 2 from each group" },
    { value: 3, label: "Top 3 from each group" },
    { value: 4, label: "Top 4 from each group" },
  ].filter((option) => option.value <= maxQualifiers);

  return (
    <div className="mx-auto max-w-7xl px-0 py-4 text-white sm:px-4 sm:py-8">
      <div className="surface rounded-lg p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-yellow-200">Tournament structure</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Fixtures & Groups</h1>
            {activeTournament && (
              <p className="safe-text mt-2 text-gray-300">{activeTournament.name} • {activeTournament.year}</p>
            )}
          </div>
          <span className="rounded-md border border-white/10 bg-gray-950/70 px-3 py-2 text-sm text-gray-300">
            {teams.length} team{teams.length === 1 ? "" : "s"}
          </span>
        </div>

        {!activeTournament ? (
          <p className="mt-6 rounded-md border border-white/10 bg-gray-950/70 p-4 text-gray-300">
            Select a tournament first.
          </p>
        ) : loading || fixtureLoading ? (
          <p className="mt-6 text-gray-300">Loading fixture details...</p>
        ) : error ? (
          <p className="mt-6 rounded-md border border-red-400/30 bg-red-500/10 p-4 text-red-100">{error}</p>
        ) : teams.length < 2 ? (
          <p className="mt-6 rounded-md border border-white/10 bg-gray-950/70 p-4 text-gray-300">
            Add at least two teams before creating fixtures.
          </p>
        ) : (
          <>
            {!canManageActiveTournament && (
              <p className="mt-6 rounded-md border border-yellow-300/30 bg-yellow-300/10 p-4 text-yellow-100">
                This view is read-only for you. Tournament creators can use it to plan fixtures.
              </p>
            )}

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <label className="block text-sm text-gray-300">
                Number of groups
                <select
                  value={normalizedGroupCount}
                  onChange={(event) => handleGroupCountChange(Number(event.target.value))}
                  disabled={!canManageActiveTournament}
                  className="input-surface mt-1 w-full rounded-md px-3 py-2"
                >
                  {Array.from({ length: maxGroups }, (_, index) => index + 1)
                    .filter((value) => value <= teams.length && teams.length / value >= 1)
                    .map((value) => (
                      <option key={value} value={value}>{value} group{value === 1 ? "" : "s"}</option>
                    ))}
                </select>
              </label>

              <label className="block text-sm text-gray-300">
                Qualification rule
                <select
                  value={normalizedQualifiers}
                  onChange={(event) => handleQualifiersChange(Number(event.target.value))}
                  disabled={!canManageActiveTournament}
                  className="input-surface mt-1 w-full rounded-md px-3 py-2"
                >
                  {ruleOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <div className="rounded-md border border-white/10 bg-gray-950/70 p-4 text-sm text-gray-300">
                <p className="font-semibold text-yellow-100">Knockout pairing</p>
                <p className="mt-1">
                  Highest ranked qualifier is paired against the lowest ranked available qualifier from another group.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-400">
                Fixture data is stored against the selected tournament and shown read-only to signed-in users.
              </p>
              {canManageActiveTournament && (
                <button
                  type="button"
                  onClick={saveFixtureSetup}
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center rounded-md bg-yellow-400 px-4 py-2 font-semibold text-gray-950 hover:bg-yellow-300 disabled:opacity-60 sm:w-auto"
                >
                  {saving ? "Saving..." : "Save Fixtures"}
                </button>
              )}
            </div>
            {saveMessage && (
              <p className="mt-3 rounded-md border border-white/10 bg-gray-950/70 p-3 text-sm text-gray-200">
                {saveMessage}
              </p>
            )}

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {groups.map((group) => (
                <section key={group.id} className="rounded-lg border border-white/10 bg-gray-950/70 p-4">
                  <h2 className="text-lg font-bold text-yellow-300">{group.name}</h2>
                  <div className="mt-4 space-y-3">
                    {group.teams.map((team, index) => (
                      <div key={team.id} className="grid gap-2 rounded-md border border-white/10 bg-white/5 p-3 sm:grid-cols-[1fr_8rem] sm:items-center">
                        <div className="min-w-0">
                          <p className="safe-text font-semibold text-white">{getTeamLabel(team)}</p>
                          {team.teamUniqueId && <p className="break-all text-xs text-gray-400">{team.teamUniqueId}</p>}
                        </div>
                        <label className="text-xs text-gray-400">
                          Rank
                          <select
                            value={standings[team.id] || index + 1}
                            onChange={(event) => handleStandingChange(team.id, event.target.value)}
                            disabled={!canManageActiveTournament}
                            className="input-surface mt-1 w-full rounded-md px-2 py-2"
                          >
                            {group.teams.map((_, rankIndex) => (
                              <option key={rankIndex + 1} value={rankIndex + 1}>{rankIndex + 1}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
              <section className="rounded-lg border border-white/10 bg-gray-950/70 p-4">
                <h2 className="text-xl font-bold text-white">Group Stage Fixtures</h2>
                <div className="mt-4 space-y-3">
                  {groupFixtures.map((fixture, index) => (
                    <div key={`${fixture.group}-${fixture.home.id}-${fixture.away.id}`} className="rounded-md border border-white/10 bg-white/5 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-yellow-200">
                        Match {index + 1} • {fixture.group}
                      </p>
                      <p className="safe-text mt-1 font-semibold text-white">
                        {getTeamLabel(fixture.home)} vs {getTeamLabel(fixture.away)}
                      </p>
                    </div>
                  ))}
                  {groupFixtures.length === 0 && (
                    <p className="text-gray-400">No group fixtures available for this setup.</p>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-white/10 bg-gray-950/70 p-4">
                <h2 className="text-xl font-bold text-white">Knockout Bracket</h2>
                {!canGenerateKnockout ? (
                  <p className="mt-4 text-gray-400">Choose enough qualifiers to generate knockout fixtures.</p>
                ) : (
                  <div className="mt-4 space-y-5">
                    {knockoutRounds.map((round, roundIndex) => (
                      <div key={`${round.name}-${roundIndex}`}>
                        <h3 className="font-semibold text-yellow-300">{round.name}</h3>
                        <div className="mt-3 space-y-3">
                          {round.matches.map((match, matchIndex) => (
                            <div key={`${round.name}-${matchIndex}`} className="rounded-md border border-white/10 bg-white/5 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                Match {matchIndex + 1}
                              </p>
                              <p className="safe-text mt-1 font-semibold text-white">
                                {getEntrantLabel(match.home)} vs {getEntrantLabel(match.away)}
                              </p>
                              {(getEntrantMeta(match.home) || getEntrantMeta(match.away)) && (
                                <p className="mt-1 text-xs text-gray-400">
                                  {[getEntrantMeta(match.home), getEntrantMeta(match.away)].filter(Boolean).join(" vs ")}
                                </p>
                              )}

                              <label className="mt-3 block text-xs text-gray-400">
                                Winner
                                <select
                                  value={match.selectedWinnerId}
                                  onChange={(event) => handleWinnerChange(match.id, event.target.value)}
                                  disabled={!canManageActiveTournament || match.options.length < 2}
                                  className="input-surface mt-1 w-full rounded-md px-3 py-2"
                                >
                                  <option value="">
                                    {match.options.length < 2 ? "Waiting for previous winner" : "Select winner"}
                                  </option>
                                  {match.options.map((entrant) => (
                                    <option key={entrant.team.id} value={entrant.team.id}>
                                      {getTeamLabel(entrant.team)}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              {match.selectedWinnerId && (
                                <p className="safe-text mt-2 rounded-md bg-green-400/10 px-3 py-2 text-sm font-semibold text-green-200">
                                  Winner: {getTeamLabel(match.options.find((entrant) => entrant.team.id === match.selectedWinnerId)?.team)}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
