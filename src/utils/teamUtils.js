export const getTeamPurse = (team, fallback = 0) => {
  const value = team?.teamPurse ?? team?.purse ?? fallback;
  const purse = Number(value);
  return Number.isFinite(purse) ? purse : fallback;
};
