import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#f43f5e", "#a78bfa"];

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/expenses", label: "Expenses" },
  { to: "/budgets", label: "Budgets" },
  { to: "/insights", label: "Insights" },
  { to: "/gmail", label: "Gmail Sync" },
];

export default function Dashboard() {
const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, expRes] = await Promise.all([
          api.get(`/api/expenses/summary?month=${currentMonth}`),
          api.get(`/api/expenses?page=0&size=5&month=${currentMonth}`),
        ]);
        setSummary(sumRes.data);
        setRecentExpenses(expRes.data.content || expRes.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const pieData = summary
    ? Object.entries(summary.categoryBreakdown || {}).map(([name, value]) => ({ name, value }))
    : [];

  const areaData = recentExpenses.slice().reverse().map((e, i) => ({
    name: e.expenseDate || `Day ${i + 1}`,
    amount: Number(e.amount),
  }));

  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>⬡ Expenso</div>
        <nav style={styles.nav}>
          {NAV.map(({ to, label }) => (
            <Link key={to} to={to} style={styles.navLink}>
              {label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} style={styles.logoutBtn}>
          Sign out
        </button>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Overview</h1>
            <p style={styles.pageSub}>{currentMonth}</p>
          </div>
          <div style={styles.avatar} onClick={() => navigate("/profile")} >
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
        </header>

        {loading ? (
          <div style={styles.loader}>Loading...</div>
        ) : (
          <>
            {/* Stats row */}
            <div style={styles.statsRow}>
              <StatCard label="Total Spent" value={`₹${summary?.total?.toLocaleString() || 0}`} accent="#6366f1" />
              <StatCard label="Categories" value={pieData.length} accent="#22d3ee" />
              <StatCard label="Transactions" value={recentExpenses.length} accent="#10b981" />
            </div>

            {/* Charts row */}
            <div style={styles.chartsRow}>
              {/* Area chart */}
              <div style={styles.chartBox}>
                <h3 style={styles.chartTitle}>Spending Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={areaData}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1e1e2e" />
                    <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#475569", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "#13131a", border: "1px solid #1e1e2e", borderRadius: 8 }}
                      labelStyle={{ color: "#94a3b8" }}
                      itemStyle={{ color: "#818cf8" }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#6366f1" fill="url(#grad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Pie chart */}
              <div style={styles.chartBox}>
                <h3 style={styles.chartTitle}>By Category</h3>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#13131a", border: "1px solid #1e1e2e", borderRadius: 8 }}
                        itemStyle={{ color: "#94a3b8" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={styles.empty}>No category data</p>
                )}
                <div style={styles.legend}>
                  {pieData.map((d, i) => (
                    <span key={d.name} style={styles.legendItem}>
                      <span style={{ ...styles.dot, background: COLORS[i % COLORS.length] }} />
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent expenses */}
            <div style={styles.chartBox}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={styles.chartTitle}>Recent Expenses</h3>
                <Link to="/expenses" style={styles.link}>View all →</Link>
              </div>
              {recentExpenses.length === 0 ? (
                <p style={styles.empty}>No expenses this month</p>
              ) : (
                recentExpenses.map((e) => (
                  <div key={e.id} style={styles.expenseRow}>
                    <div>
                      <div style={styles.expDesc}>{e.description}</div>
                      <div style={styles.expMeta}>{e.category} · {e.expenseDate}</div>
                    </div>
                    <div style={styles.expAmount}>₹{Number(e.amount).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{ ...styles.statCard, borderTop: `3px solid ${accent}` }}>
      <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: "#f1f5f9", marginTop: 8 }}>{value}</div>
    </div>
  );
}

const styles = {
  shell: { display: "flex", minHeight: "100vh", background: "#0a0a0f", fontFamily: "'DM Sans', sans-serif", color: "#f1f5f9" },
  sidebar: {
    width: 220,
    background: "#0d0d14",
    borderRight: "1px solid #1e1e2e",
    display: "flex",
    flexDirection: "column",
    padding: "32px 20px",
    position: "sticky",
    top: 0,
    height: "100vh",
  },
  brand: { fontSize: 20, fontWeight: 700, color: "#818cf8", marginBottom: 40, letterSpacing: "-0.5px" },
  nav: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  navLink: {
    color: "#64748b",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
    padding: "9px 12px",
    borderRadius: 8,
    transition: "all 0.15s",
  },
  logoutBtn: {
    background: "transparent",
    border: "1px solid #1e1e2e",
    color: "#475569",
    borderRadius: 8,
    padding: "9px",
    fontSize: 13,
    cursor: "pointer",
    marginTop: "auto",
  },
  main: { flex: 1, padding: "40px 48px", overflowY: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 },
  pageTitle: { margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px" },
  pageSub: { color: "#475569", fontSize: 14, margin: "4px 0 0" },
  avatar: {
    width: 40, height: 40, background: "#6366f1", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16,
  },
  loader: { color: "#475569", marginTop: 60, textAlign: "center" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 },
  statCard: {
    background: "#13131a",
    border: "1px solid #1e1e2e",
    borderRadius: 12,
    padding: "20px 24px",
  },
  chartsRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 },
  chartBox: {
    background: "#13131a",
    border: "1px solid #1e1e2e",
    borderRadius: 12,
    padding: "24px",
  },
  chartTitle: { margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" },
  legend: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 },
  legendItem: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" },
  dot: { width: 8, height: 8, borderRadius: "50%", display: "inline-block" },
  expenseRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #1e1e2e",
  },
  expDesc: { fontSize: 14, color: "#e2e8f0", fontWeight: 500 },
  expMeta: { fontSize: 12, color: "#475569", marginTop: 2 },
  expAmount: { fontSize: 15, fontWeight: 700, color: "#818cf8" },
  empty: { color: "#475569", fontSize: 13, textAlign: "center", padding: "20px 0" },
  link: { color: "#818cf8", textDecoration: "none", fontSize: 13, fontWeight: 600 },
};