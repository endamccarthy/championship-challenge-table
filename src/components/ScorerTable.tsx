import type { ScorerEntry } from "../types";

interface ScorerTableProps {
  data: ScorerEntry[];
  title: string;
  gameHeaders: string[];
  variant?: "munster" | "leinster";
}

export function ScorerTable({
  data,
  title,
  gameHeaders,
  variant,
}: ScorerTableProps) {
  const showFinal = data.some((e) => e.final !== "");

  return (
    <div>
      <h2
        class={`scorer-page-title${variant ? ` scorer-page-title--${variant}` : ""}`}
      >
        {title}
      </h2>
      <div
        class={`table-container${variant ? ` table-container--${variant}` : ""}`}
      >
        <div class="table-scroll">
          <table class="scorer-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>County</th>
                <th>Total</th>
                {gameHeaders.map((h) => (
                  <th key={h}>{h}</th>
                ))}
                {showFinal && <th>Final</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((entry) => (
                <tr key={entry.player}>
                  <td data-label="Player">
                    <strong>{entry.player}</strong>
                  </td>
                  <td data-label="County">{entry.county}</td>
                  <td data-label="Total">
                    <strong>{entry.totalDisplay}</strong>
                  </td>
                  {entry.games.map((g, i) => (
                    <td key={i} data-label={gameHeaders[i] ?? `Game ${i + 1}`}>
                      {g}
                    </td>
                  ))}
                  {showFinal && <td data-label="Final">{entry.final}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div class="scorer-card-list">
          {data.map((entry, index) => (
            <div
              class="scorer-card"
              key={entry.player}
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              <div class="scorer-card-header">
                <div class="scorer-card-left">
                  <span class="scorer-card-player">{entry.player}</span>
                  <span class="scorer-card-county">{entry.county}</span>
                </div>
                <span class="scorer-card-total">{entry.totalDisplay}</span>
              </div>
              <div class="scorer-card-games">
                {entry.games.map((g, i) =>
                  g ? (
                    <div class="scorer-card-game" key={i}>
                      <span class="scorer-card-game-label">
                        {gameHeaders[i]
                          ? gameHeaders[i].replace("Game ", "G")
                          : `G${i + 1}`}
                      </span>
                      <span class="scorer-card-game-value">{g}</span>
                    </div>
                  ) : null,
                )}
                {showFinal && (
                  <div class="scorer-card-game">
                    <span class="scorer-card-game-label">Final</span>
                    <span class="scorer-card-game-value">{entry.final}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div class="scroll-end">Showing top 20 scorers</div>
      </div>
    </div>
  );
}
