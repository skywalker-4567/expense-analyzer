import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/expenses", label: "Expenses" },
  { to: "/budgets", label: "Budgets" },
  { to: "/insights", label: "Insights" },
  { to: "/gmail", label: "Gmail Sync" },
];

export default function Profile() {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  useEffect(() => {
    api.get("/api/users/me")
      .then(({ data }) => setProfile(data))
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>⬡ Expenso</div>
        <nav style={styles.nav}>
          {NAV.map(({ to, label }) => (
            <Link key={to} to={to} style={{
              ...styles.navLink,
              ...(location.pathname === to ? styles.navActive : {}),
            }}>
              {label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} style={styles.logoutBtn}>Sign out</button>
      </aside>

      <main style={styles.main}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>Profile</h1>
            <p style={styles.pageSub}>Your account details</p>
          </div>
        </div>

        {loading && <div style={styles.empty}>Loading...</div>}
        {error && <div style={styles.errorMsg}>{error}</div>}

        {profile && (
          <div style={styles.card}>
            {/* Avatar */}
            <div style={styles.avatarRow}>
              <div style={styles.avatar}>
                {profile.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={styles.profileName}>{profile.name}</div>
                <div style={styles.profileEmail}>{profile.email}</div>
              </div>
            </div>

            <div style={styles.divider} />

            {/* Stats */}
            <div style={styles.statsRow}>
              <div style={styles.statBox}>
                <div style={styles.statValue}>{profile.totalExpenses}</div>
                <div style={styles.statLabel}>Total Expenses</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statValue}>{profile.totalBudgets}</div>
                <div style={styles.statLabel}>Budgets Set</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statValue}>
                  {new Date(profile.joinedAt).toLocaleDateString("en-IN", {
                    month: "short", year: "numeric"
                  })}
                </div>
                <div style={styles.statLabel}>Member Since</div>
              </div>
            </div>

            <div style={styles.divider} />

            {/* Details */}
            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>Full Name</div>
                <div style={styles.detailValue}>{profile.name}</div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>Email Address</div>
                <div style={styles.detailValue}>{profile.email}</div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>Account ID</div>
                <div style={styles.detailValue}>#{profile.id}</div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailLabel}>Joined</div>
                <div style={styles.detailValue}>
                  {new Date(profile.joinedAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "long", year: "numeric"
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  shell: { display: "flex", minHeight: "100vh", background: "#0a0a0f", fontFamily: "'DM Sans', sans-serif", color: "#f1f5f9" },
  sidebar: { width: 220, background: "#0d0d14", borderRight: "1px solid #1e1e2e", display: "flex", flexDirection: "column", padding: "32px 20px", position: "sticky", top: 0, height: "100vh" },
  brand: { fontSize: 20, fontWeight: 700, color: "#818cf8", marginBottom: 40, letterSpacing: "-0.5px" },
  nav: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  navLink: { color: "#64748b", textDecoration: "none", fontSize: 14, fontWeight: 500, padding: "9px 12px", borderRadius: 8 },
  navActive: { color: "#f1f5f9", background: "#1e1e2e" },
  logoutBtn: { background: "transparent", border: "1px solid #1e1e2e", color: "#475569", borderRadius: 8, padding: 9, fontSize: 13, cursor: "pointer" },
  main: { flex: 1, padding: "40px 48px" },
  topBar: { marginBottom: 32 },
  pageTitle: { margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px" },
  pageSub: { color: "#475569", fontSize: 14, margin: "4px 0 0" },
  empty: { color: "#475569", textAlign: "center", padding: "40px 0", fontSize: 14 },
  errorMsg: { color: "#fca5a5", background: "#2d1a1a", border: "1px solid #7f1d1d", borderRadius: 10, padding: "14px 20px", fontSize: 14 },
  card: { background: "#13131a", border: "1px solid #1e1e2e", borderRadius: 16, padding: "32px 36px", maxWidth: 640 },
  avatarRow: { display: "flex", alignItems: "center", gap: 20, marginBottom: 28 },
  avatar: { width: 64, height: 64, borderRadius: "50%", background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: "#fff" },
  profileName: { fontSize: 20, fontWeight: 700, color: "#f1f5f9" },
  profileEmail: { fontSize: 14, color: "#64748b", marginTop: 4 },
  divider: { height: 1, background: "#1e1e2e", margin: "24px 0" },
  statsRow: { display: "flex", gap: 24 },
  statBox: { flex: 1, background: "#0d0d14", borderRadius: 12, padding: "18px 20px", textAlign: "center" },
  statValue: { fontSize: 22, fontWeight: 700, color: "#818cf8", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#475569", fontWeight: 500 },
  detailsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  detailItem: { display: "flex", flexDirection: "column", gap: 6 },
  detailLabel: { fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" },
  detailValue: { fontSize: 15, color: "#e2e8f0", fontWeight: 500 },
};