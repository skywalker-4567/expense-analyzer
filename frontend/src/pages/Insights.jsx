import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../api/axios";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/expenses", label: "Expenses" },
  { to: "/budgets", label: "Budgets" },
  { to: "/insights", label: "Insights" },
  { to: "/gmail", label: "Gmail Sync" },
];

const INSIGHT_ICONS = [
  "💡", "📈", "⚠️", "🎯", "💸", "📊", "🔔", "✅",
];

export default function Insights() {
  const location = useLocation();
  const logout = () => { localStorage.removeItem("token"); window.location.href = "/login"; };

  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/api/insights");
        setInsights(data || []);
      } catch (e) {
        setError("Failed to load insights. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>⬡ Expenso</div>
        <nav style={styles.nav}>
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{ ...styles.navLink, ...(location.pathname === to ? styles.navActive : {}) }}
            >
              {label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} style={styles.logoutBtn}>Sign out</button>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>Insights</h1>
            <p style={styles.pageSub}>AI-generated observations about your spending</p>
          </div>
          <div style={styles.countBadge}>
            {!loading && `${insights.length} insight${insights.length !== 1 ? "s" : ""}`}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={styles.loadingGrid}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={styles.skeleton} />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={styles.errorBox}>{error}</div>
        )}

        {/* Empty */}
        {!loading && !error && insights.length === 0 && (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>🔍</div>
            <div style={styles.emptyTitle}>No insights yet</div>
            <div style={styles.emptySub}>
              Add more expenses so the system can analyze your spending patterns.
            </div>
          </div>
        )}

        {/* Insight cards */}
        {!loading && !error && insights.length > 0 && (
          <div style={styles.list}>
            {insights.map((insight, i) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                icon={INSIGHT_ICONS[i % INSIGHT_ICONS.length]}
                index={i}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function InsightCard({ insight, icon, index }) {
  // Classify tone by keywords for accent color
  const msg = (insight.message || "").toLowerCase();
  const isWarning = msg.includes("over") || msg.includes("exceed") || msg.includes("more than") || msg.includes("high");
  const isPositive = msg.includes("saved") || msg.includes("under") || msg.includes("good") || msg.includes("less than");
  const accent = isWarning ? "#f59e0b" : isPositive ? "#10b981" : "#6366f1";

  return (
    <div
      style={{
        ...cardStyles.card,
        animationDelay: `${index * 60}ms`,
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <div style={cardStyles.iconWrap}>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={cardStyles.content}>
        <p style={cardStyles.message}>{insight.message}</p>
        {insight.createdAt && (
          <span style={cardStyles.date}>
            {new Date(insight.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        )}
      </div>
      <div style={{ ...cardStyles.accent, color: accent }}>
        {isWarning ? "⚠ Review" : isPositive ? "✓ Good" : "→"}
      </div>
    </div>
  );
}

const styles = {
  shell: {
    display: "flex", minHeight: "100vh", background: "#0a0a0f",
    fontFamily: "'DM Sans', sans-serif", color: "#f1f5f9",
  },
  sidebar: {
    width: 220, background: "#0d0d14", borderRight: "1px solid #1e1e2e",
    display: "flex", flexDirection: "column", padding: "32px 20px",
    position: "sticky", top: 0, height: "100vh",
  },
  brand: { fontSize: 20, fontWeight: 700, color: "#818cf8", marginBottom: 40, letterSpacing: "-0.5px" },
  nav: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  navLink: { color: "#64748b", textDecoration: "none", fontSize: 14, fontWeight: 500, padding: "9px 12px", borderRadius: 8 },
  navActive: { color: "#f1f5f9", background: "#1e1e2e" },
  logoutBtn: { background: "transparent", border: "1px solid #1e1e2e", color: "#475569", borderRadius: 8, padding: 9, fontSize: 13, cursor: "pointer" },
  main: { flex: 1, padding: "40px 48px" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 },
  pageTitle: { margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px" },
  pageSub: { color: "#475569", fontSize: 14, margin: "4px 0 0" },
  countBadge: {
    background: "#13131a", border: "1px solid #1e1e2e", color: "#64748b",
    borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 600,
  },
  loadingGrid: { display: "flex", flexDirection: "column", gap: 12 },
  skeleton: {
    background: "linear-gradient(90deg, #13131a 25%, #1e1e2e 50%, #13131a 75%)",
    backgroundSize: "200% 100%",
    borderRadius: 12, height: 80,
    animation: "shimmer 1.4s infinite",
  },
  errorBox: {
    background: "#2d1a1a", border: "1px solid #7f1d1d", color: "#fca5a5",
    padding: "14px 18px", borderRadius: 10, fontSize: 14,
  },
  emptyCard: {
    background: "#13131a", border: "1px dashed #1e1e2e", borderRadius: 14,
    padding: "60px 24px", textAlign: "center",
  },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: "#e2e8f0", marginBottom: 6 },
  emptySub: { fontSize: 13, color: "#475569", maxWidth: 340, margin: "0 auto" },
  list: { display: "flex", flexDirection: "column", gap: 12 },
};

const cardStyles = {
  card: {
    background: "#13131a", border: "1px solid #1e1e2e", borderRadius: 12,
    padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 16,
    animation: "fadeUp 0.3s ease both",
  },
  iconWrap: {
    width: 42, height: 42, background: "#0d0d14", border: "1px solid #1e1e2e",
    borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  content: { flex: 1 },
  message: { margin: 0, fontSize: 15, color: "#e2e8f0", lineHeight: 1.6, fontWeight: 500 },
  date: { fontSize: 12, color: "#475569", marginTop: 6, display: "block" },
  accent: { fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", paddingTop: 2 },
};