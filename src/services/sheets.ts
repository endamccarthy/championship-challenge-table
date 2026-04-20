import type { LeaderboardEntry, ScorerEntry, ScorerResult } from "../types";

const API_KEY = import.meta.env.VITE_SHEETS_API_KEY as string;
const SHEET_ID = import.meta.env.VITE_SHEET_ID as string;

/** Parse a "G-P" score string into { goals, points }. Returns 0-0 for empty/invalid. */
function parseScore(score: string): { goals: number; points: number } {
  const match = score.trim().match(/^(\d+)-(\d+)$/);
  if (!match) return { goals: 0, points: 0 };
  return { goals: parseInt(match[1], 10), points: parseInt(match[2], 10) };
}

/** Build sorted ScorerResult from raw sheet rows (first row = headers). */
function buildScorers(rows: string[][]): ScorerResult {
  if (rows.length < 2) return { entries: [], gameHeaders: [] };

  const headerRow = rows[0];
  // Columns: Player, County, Game 1, Game 2, …, Final
  const allGameHeaders = headerRow.slice(2, -1);
  const totalScoreColumns = headerRow.length - 2; // games + final

  const dataRows = rows.slice(1);

  const entries: ScorerEntry[] = dataRows.map((row) => {
    const player = row[0] ?? "";
    const county = row[1] ?? "";
    const rawScores = row.slice(2);
    // Pad to expected column count (Google Sheets omits trailing empty cells)
    const padded = Array.from(
      { length: totalScoreColumns },
      (_, i) => rawScores[i]?.trim() ?? "",
    );
    const games = padded.slice(0, -1);
    const final = padded[padded.length - 1];

    let totalGoals = 0;
    let totalPoints = 0;
    for (const s of padded) {
      if (!s) continue;
      const { goals, points } = parseScore(s);
      totalGoals += goals;
      totalPoints += points;
    }

    const totalNumeric = totalGoals * 3 + totalPoints;
    const totalDisplay = `${totalGoals}-${totalPoints} (${totalNumeric}pts)`;

    return { player, county, totalDisplay, totalNumeric, games, final };
  });

  // Only include game columns where at least one player has a value
  const activeGameIndices = allGameHeaders
    .map((_, i) => i)
    .filter((i) => entries.some((e) => e.games[i] !== ""));

  const gameHeaders = activeGameIndices.map((i) => allGameHeaders[i]);
  for (const entry of entries) {
    entry.games = activeGameIndices.map((i) => entry.games[i]);
  }

  return {
    entries: entries
      .sort((a, b) => b.totalNumeric - a.totalNumeric)
      .slice(0, 20),
    gameHeaders,
  };
}

async function fetchSheet(range: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch sheet data: ${res.status}`);
  }
  const data = await res.json();
  return data.values ?? [];
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const rows = await fetchSheet("Leaderboard!A2:H");
  const entries = rows.map((row) => ({
    name: row[1] ?? "",
    points: parseInt(row[2] ?? "0", 10),
    munsterWinner: row[3] ?? "",
    leinsterWinner: row[4] ?? "",
    topScorerMunster: row[5] ?? "",
    topScorerLeinster: row[6] ?? "",
  }));
  return entries.sort((a, b) => b.points - a.points);
}

export async function fetchMunsterScorers(): Promise<ScorerResult> {
  const rows = await fetchSheet("Top Scorers Munster!A2:Z");
  return buildScorers(rows);
}

export async function fetchLeinsterScorers(): Promise<ScorerResult> {
  const rows = await fetchSheet("Top Scorers Leinster!A2:Z");
  return buildScorers(rows);
}
