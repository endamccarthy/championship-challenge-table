import { useState, useEffect, useCallback } from "preact/hooks";
import type { Tab, LeaderboardEntry, ScorerEntry } from "./types";
import { Navbar } from "./components/Navbar";
import { LeaderboardTable } from "./components/LeaderboardTable";
import { ScorerTable } from "./components/ScorerTable";
import {
  fetchLeaderboard,
  fetchMunsterScorers,
  fetchLeinsterScorers,
} from "./services/sheets";

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>("leaderboard");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [munsterScorers, setMunsterScorers] = useState<ScorerEntry[]>([]);
  const [leinsterScorers, setLeinsterScorers] = useState<ScorerEntry[]>([]);
  const [munsterGameHeaders, setMunsterGameHeaders] = useState<string[]>([]);
  const [leinsterGameHeaders, setLeinsterGameHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    Promise.all([
      fetchLeaderboard(),
      fetchMunsterScorers(),
      fetchLeinsterScorers(),
    ])
      .then(([lb, ms, ls]) => {
        setLeaderboard(lb);
        setMunsterScorers(ms.entries);
        setLeinsterScorers(ls.entries);
        setMunsterGameHeaders(ms.gameHeaders);
        setLeinsterGameHeaders(ls.gameHeaders);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to fetch data:", err);
        setError("Unable to load data.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div class="app">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main class="main-content" role="tabpanel">
        {error && (
          <div class="error-banner" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div class="loading" aria-live="polite">
            <div class="spinner" />
            <p>Loading data...</p>
          </div>
        ) : (
          <>
            {activeTab === "leaderboard" && (
              <LeaderboardTable data={leaderboard} />
            )}
            {activeTab === "munster" && (
              <ScorerTable
                data={munsterScorers}
                title="Munster Top Scorers (from play)"
                gameHeaders={munsterGameHeaders}
                variant="munster"
              />
            )}
            {activeTab === "leinster" && (
              <ScorerTable
                data={leinsterScorers}
                title="Leinster Top Scorers (from play)"
                gameHeaders={leinsterGameHeaders}
                variant="leinster"
              />
            )}
          </>
        )}
      </main>

      <button
        class={`back-to-top${showBackToTop ? " visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>

      <footer class="site-footer">
        <p>© 2026 Enda McCarthy</p>
      </footer>
    </div>
  );
}
