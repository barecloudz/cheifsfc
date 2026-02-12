"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminMatchForm from "@/components/AdminMatchForm";

interface Team {
  id: number;
  name: string;
}

interface MatchData {
  id: number;
  date: string;
  venue: string;
  homeTeamId: number;
  awayTeamId: number;
  homeTeam: { name: string };
  awayTeam: { name: string };
  homeScore: number | null;
  awayScore: number | null;
}

interface EditForm {
  date: string;
  time: string;
  venue: string;
  homeTeamId: string;
  awayTeamId: string;
}

interface Standing {
  id: number;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

type Tab = "schedule" | "add" | "table";

export default function AdminDashboard() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [scoreInputs, setScoreInputs] = useState<Record<number, { home: string; away: string }>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("schedule");
  const [saving, setSaving] = useState<number | null>(null);

  // Edit match state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ date: "", time: "", venue: "", homeTeamId: "", awayTeamId: "" });

  // Table management state
  const [newTeamName, setNewTeamName] = useState("");
  const [addingTeam, setAddingTeam] = useState(false);
  const [quickHome, setQuickHome] = useState("");
  const [quickAway, setQuickAway] = useState("");
  const [quickHomeScore, setQuickHomeScore] = useState("");
  const [quickAwayScore, setQuickAwayScore] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/login", { method: "GET" }).then((r) => {
      if (!r.ok) router.push("/admin/login");
      else setAuthenticated(true);
    });
  }, [router]);

  useEffect(() => {
    if (!authenticated) return;
    loadData();
  }, [authenticated]);

  function loadData() {
    fetch("/api/matches?filter=all").then((r) => r.json()).then(setMatches);
    fetch("/api/standings").then((r) => r.json()).then((data) => {
      if (data.teams) setTeams(data.teams);
      if (data.standings) setStandings(data.standings);
    });
  }

  async function submitScore(matchId: number) {
    const input = scoreInputs[matchId];
    if (!input || input.home === "" || input.away === "") return;
    setSaving(matchId);
    await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: matchId, homeScore: parseInt(input.home), awayScore: parseInt(input.away) }),
    });
    setScoreInputs((p) => { const n = { ...p }; delete n[matchId]; return n; });
    setSaving(null);
    loadData();
  }

  async function deleteMatch(matchId: number) {
    if (!confirm("Delete this match?")) return;
    await fetch("/api/matches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: matchId }),
    });
    loadData();
  }

  function startEdit(m: MatchData) {
    const d = new Date(m.date);
    const dateStr = d.toISOString().split("T")[0];
    const timeStr = d.toTimeString().slice(0, 5);
    setEditForm({
      date: dateStr,
      time: timeStr,
      venue: m.venue,
      homeTeamId: String(m.homeTeamId),
      awayTeamId: String(m.awayTeamId),
    });
    setEditingId(m.id);
  }

  async function saveEdit(matchId: number) {
    setSaving(matchId);
    const dateTime = new Date(`${editForm.date}T${editForm.time}:00`);
    await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: matchId,
        date: dateTime.toISOString(),
        venue: editForm.venue,
        homeTeamId: parseInt(editForm.homeTeamId),
        awayTeamId: parseInt(editForm.awayTeamId),
      }),
    });
    setSaving(null);
    setEditingId(null);
    loadData();
  }

  async function addTeam() {
    if (!newTeamName.trim()) return;
    setAddingTeam(true);
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTeamName.trim() }),
    });
    setAddingTeam(false);
    if (res.ok) {
      setNewTeamName("");
      loadData();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to add team");
    }
  }

  async function deleteTeam(teamId: number, teamName: string) {
    if (!confirm(`Delete ${teamName}? This will also delete all their matches.`)) return;
    await fetch("/api/teams", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: teamId }),
    });
    loadData();
  }

  async function quickResult() {
    if (!quickHome || !quickAway || quickHomeScore === "" || quickAwayScore === "" || quickHome === quickAway) return;
    setQuickSaving(true);
    await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date().toISOString(),
        venue: "League Match",
        homeTeamId: parseInt(quickHome),
        awayTeamId: parseInt(quickAway),
        homeScore: parseInt(quickHomeScore),
        awayScore: parseInt(quickAwayScore),
      }),
    });
    setQuickSaving(false);
    setQuickHome("");
    setQuickAway("");
    setQuickHomeScore("");
    setQuickAwayScore("");
    loadData();
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-maroon border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const upcoming = matches.filter((m) => m.homeScore === null).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const completed = matches.filter((m) => m.homeScore !== null).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const tabTitles: Record<Tab, string> = {
    schedule: "Manage Matches",
    add: "Add New Match",
    table: "Manage Table",
  };

  const menuItems: { id: Tab; label: string; iconSvg: React.ReactNode }[] = [
    {
      id: "schedule",
      label: "Manage Matches",
      iconSvg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      id: "add",
      label: "Add New Match",
      iconSvg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
    {
      id: "table",
      label: "Manage Table",
      iconSvg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7" />
          <path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7" />
          <path d="M4 22h16" />
          <path d="M10 22V10" />
          <path d="M14 22V10" />
          <path d="M6 9h12v4a8 8 0 01-12 0V9z" />
        </svg>
      ),
    },
  ];

  const inputClass = "w-full bg-white border-2 border-card-border rounded-xl px-3 py-3 text-base text-center text-foreground font-bold focus:outline-none focus:border-maroon";
  const selectClass = "w-full bg-background border border-card-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-maroon focus:ring-1 focus:ring-maroon/10";

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col animate-[slideIn_0.2s_ease-out]">
            <div className="bg-maroon-gradient p-5 pb-6">
              <Image src="/logo.png" alt="Chiefs FC" width={48} height={48} className="mb-3" />
              <p className="text-white font-bold text-base">Chiefs FC</p>
              <p className="text-white/60 text-xs">Admin Panel</p>
            </div>

            <nav className="flex-1 py-3">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setTab(item.id); setSidebarOpen(false); window.scrollTo({ top: 0, behavior: "instant" }); }}
                  className={`btn-touch w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${
                    tab === item.id
                      ? "bg-maroon/8 text-maroon font-semibold"
                      : "text-foreground-secondary"
                  }`}
                >
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    tab === item.id ? "bg-maroon text-white" : "bg-background-secondary text-muted"
                  }`}>
                    {item.iconSvg}
                  </span>
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-card-border space-y-1">
              <button
                onClick={() => { setSidebarOpen(false); router.push("/"); }}
                className="btn-touch w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground-secondary active:opacity-70 rounded-xl hover:bg-background-secondary"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Back to App
              </button>
              <button
                onClick={async () => {
                  await fetch("/api/admin/login", { method: "DELETE" });
                  router.push("/admin/login");
                }}
                className="btn-touch w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 active:opacity-70 rounded-xl hover:bg-red-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="app-header">
        <div className="w-full flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn-touch w-10 h-10 -ml-1 rounded-xl flex items-center justify-center active:bg-background-secondary"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="15" y2="12" />
              <line x1="3" y1="18" x2="18" y2="18" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">{tabTitles[tab]}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 pt-4 pb-8 md:max-w-3xl">

        {/* ADD MATCH */}
        {tab === "add" && (
          <div className="card-premium p-5 animate-fadeInUp">
            <AdminMatchForm teams={teams} onSuccess={() => { loadData(); setTab("schedule"); }} />
          </div>
        )}

        {/* MANAGE TABLE */}
        {tab === "table" && (
          <div className="space-y-5 animate-fadeInUp">
            {/* Quick Result Entry */}
            <div className="card-premium p-5">
              <h2 className="text-sm font-bold text-maroon uppercase tracking-wider mb-4">
                Quick Result Entry
              </h2>
              <p className="text-xs text-muted mb-4">Enter a result for any two teams to update the table.</p>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] text-muted uppercase tracking-wider font-medium mb-1.5">Home Team</label>
                  <select value={quickHome} onChange={(e) => setQuickHome(e.target.value)} className={selectClass} required>
                    <option value="">Select...</option>
                    {teams.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-muted uppercase tracking-wider font-medium mb-1.5">Away Team</label>
                  <select value={quickAway} onChange={(e) => setQuickAway(e.target.value)} className={selectClass} required>
                    <option value="">Select...</option>
                    {teams.filter((t) => String(t.id) !== quickHome).map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                  </select>
                </div>
              </div>

              <div className="flex items-end gap-2 mb-4">
                <div className="flex-1">
                  <label className="block text-[10px] text-muted uppercase tracking-wider font-medium mb-1.5">
                    {quickHome ? teams.find((t) => String(t.id) === quickHome)?.name?.split(" ")[0] : "Home"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className={inputClass}
                    value={quickHomeScore}
                    onChange={(e) => setQuickHomeScore(e.target.value)}
                  />
                </div>
                <span className="text-muted font-bold text-lg pb-3">-</span>
                <div className="flex-1">
                  <label className="block text-[10px] text-muted uppercase tracking-wider font-medium mb-1.5">
                    {quickAway ? teams.find((t) => String(t.id) === quickAway)?.name?.split(" ")[0] : "Away"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className={inputClass}
                    value={quickAwayScore}
                    onChange={(e) => setQuickAwayScore(e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={quickResult}
                disabled={quickSaving || !quickHome || !quickAway || quickHomeScore === "" || quickAwayScore === "" || quickHome === quickAway}
                className="btn-touch w-full bg-maroon text-white text-sm font-semibold py-3 rounded-xl active:scale-95 disabled:opacity-50"
              >
                {quickSaving ? "Saving..." : "Submit Result"}
              </button>
            </div>

            {/* Current Standings */}
            <div className="card-premium p-4">
              <h2 className="text-sm font-bold text-maroon uppercase tracking-wider mb-3 px-1">
                Current Standings
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray text-[10px] uppercase tracking-wider border-b border-card-border">
                      <th className="text-left py-2 px-2 w-6">#</th>
                      <th className="text-left py-2 px-2">Team</th>
                      <th className="text-center py-2 px-1">P</th>
                      <th className="text-center py-2 px-1">W</th>
                      <th className="text-center py-2 px-1">D</th>
                      <th className="text-center py-2 px-1">L</th>
                      <th className="text-center py-2 px-1">GD</th>
                      <th className="text-center py-2 px-1 text-maroon font-semibold">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((team, i) => {
                      const isChiefs = team.name === "Chiefs FC";
                      return (
                        <tr key={team.id} className={`border-b border-card-border ${isChiefs ? "bg-maroon/5" : ""}`}>
                          <td className={`py-2.5 px-2 text-xs ${isChiefs ? "text-maroon font-bold" : "text-gray"}`}>{i + 1}</td>
                          <td className={`py-2.5 px-2 font-medium text-xs ${isChiefs ? "text-maroon" : ""}`}>{team.name}</td>
                          <td className="text-center py-2.5 px-1 text-xs text-foreground-secondary">{team.played}</td>
                          <td className="text-center py-2.5 px-1 text-xs text-foreground-secondary">{team.won}</td>
                          <td className="text-center py-2.5 px-1 text-xs text-foreground-secondary">{team.drawn}</td>
                          <td className="text-center py-2.5 px-1 text-xs text-foreground-secondary">{team.lost}</td>
                          <td className="text-center py-2.5 px-1 text-xs text-foreground-secondary">{team.goalDifference}</td>
                          <td className={`text-center py-2.5 px-1 text-xs font-bold ${isChiefs ? "text-maroon" : "text-foreground"}`}>{team.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {standings.length === 0 && (
                <p className="text-center text-muted text-sm py-6">No teams yet. Add teams below.</p>
              )}
            </div>

            {/* Manage Teams */}
            <div className="card-premium p-5">
              <h2 className="text-sm font-bold text-maroon uppercase tracking-wider mb-4">
                Manage Teams
              </h2>

              {/* Add team */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="New team name..."
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addTeam(); }}
                  className="flex-1 bg-background border border-card-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-gray focus:outline-none focus:border-maroon focus:ring-1 focus:ring-maroon/10"
                />
                <button
                  onClick={addTeam}
                  disabled={addingTeam || !newTeamName.trim()}
                  className="btn-touch bg-maroon text-white text-sm font-semibold px-4 rounded-xl active:scale-95 disabled:opacity-50"
                >
                  {addingTeam ? "..." : "Add"}
                </button>
              </div>

              {/* Team list */}
              <div className="space-y-1">
                {teams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-background-secondary transition-colors">
                    <span className="text-sm font-medium text-foreground">{team.name}</span>
                    <button
                      onClick={() => deleteTeam(team.id, team.name)}
                      className="btn-touch text-[11px] text-red-600 font-medium bg-red-50 px-2.5 py-1 rounded-lg active:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              {teams.length === 0 && (
                <p className="text-center text-muted text-sm py-4">No teams added yet</p>
              )}
            </div>
          </div>
        )}

        {/* MANAGE MATCHES */}
        {tab === "schedule" && (
          <div className="animate-fadeInUp">
            {/* Upcoming - need scores */}
            {upcoming.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-bold text-maroon uppercase tracking-wider mb-3 px-1">
                  Upcoming &middot; Enter Scores
                </h2>
                <div className="space-y-3">
                  {upcoming.map((m) => (
                    <div key={m.id} className="card-premium p-4">
                      {editingId === m.id ? (
                        /* Edit mode */
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] text-maroon uppercase tracking-wider font-bold">Edit Match</p>
                            <button onClick={() => setEditingId(null)} className="text-xs text-muted font-medium active:opacity-70">Cancel</button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-muted mb-1">Date</label>
                              <input type="date" value={editForm.date} onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))} className={selectClass} />
                            </div>
                            <div>
                              <label className="block text-[10px] text-muted mb-1">Time</label>
                              <input type="time" value={editForm.time} onChange={(e) => setEditForm((p) => ({ ...p, time: e.target.value }))} className={selectClass} />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] text-muted mb-1">Venue</label>
                            <input type="text" value={editForm.venue} onChange={(e) => setEditForm((p) => ({ ...p, venue: e.target.value }))} className={selectClass} />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-muted mb-1">Home Team</label>
                              <select value={editForm.homeTeamId} onChange={(e) => setEditForm((p) => ({ ...p, homeTeamId: e.target.value }))} className={selectClass}>
                                {teams.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-muted mb-1">Away Team</label>
                              <select value={editForm.awayTeamId} onChange={(e) => setEditForm((p) => ({ ...p, awayTeamId: e.target.value }))} className={selectClass}>
                                {teams.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                              </select>
                            </div>
                          </div>
                          <button
                            onClick={() => saveEdit(m.id)}
                            disabled={saving === m.id}
                            className="btn-touch w-full bg-maroon text-white text-sm font-semibold py-2.5 rounded-xl active:scale-95 disabled:opacity-50"
                          >
                            {saving === m.id ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      ) : (
                        /* View mode */
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted font-medium">
                              {new Date(m.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                              {" \u00B7 "}
                              {new Date(m.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </span>
                            <span className="text-[10px] font-bold text-gold-dark bg-gold/15 px-2 py-0.5 rounded-full">UPCOMING</span>
                          </div>

                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-foreground">{m.homeTeam.name}</span>
                            <span className="text-xs text-muted font-semibold">vs</span>
                            <span className="text-sm font-bold text-foreground text-right">{m.awayTeam.name}</span>
                          </div>
                          <p className="text-[11px] text-muted mb-3">{m.venue}</p>

                          {/* Edit button */}
                          <button
                            onClick={() => startEdit(m)}
                            className="btn-touch w-full flex items-center justify-center gap-1.5 bg-background-secondary text-foreground-secondary text-xs font-semibold py-2 rounded-xl mb-3 active:bg-card-border"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit Match Details
                          </button>

                          {/* Score entry */}
                          <div className="bg-background rounded-xl p-3">
                            <p className="text-[10px] text-muted uppercase tracking-wider font-medium mb-2">Enter Final Score</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <label className="block text-[10px] text-muted mb-1">{m.homeTeam.name.split(" ")[0]}</label>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  className={inputClass}
                                  value={scoreInputs[m.id]?.home ?? ""}
                                  onChange={(e) =>
                                    setScoreInputs((p) => ({ ...p, [m.id]: { home: e.target.value, away: p[m.id]?.away ?? "" } }))
                                  }
                                />
                              </div>
                              <span className="text-muted font-bold text-lg mt-5">-</span>
                              <div className="flex-1">
                                <label className="block text-[10px] text-muted mb-1">{m.awayTeam.name.split(" ")[0]}</label>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  className={inputClass}
                                  value={scoreInputs[m.id]?.away ?? ""}
                                  onChange={(e) =>
                                    setScoreInputs((p) => ({ ...p, [m.id]: { home: p[m.id]?.home ?? "", away: e.target.value } }))
                                  }
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => submitScore(m.id)}
                                disabled={saving === m.id}
                                className="btn-touch flex-1 bg-maroon text-white text-sm font-semibold py-2.5 rounded-xl active:scale-95 disabled:opacity-50"
                              >
                                {saving === m.id ? "Saving..." : "Save Score"}
                              </button>
                              <button
                                onClick={() => deleteMatch(m.id)}
                                className="btn-touch w-11 bg-red-50 text-red-600 rounded-xl flex items-center justify-center active:bg-red-100"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-3 px-1">
                  Completed
                </h2>
                <div className="space-y-3">
                  {completed.map((m) => (
                    <div key={m.id} className="card-premium p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted font-medium">
                          {new Date(m.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        <span className="text-[10px] font-bold text-maroon bg-maroon/10 px-2 py-0.5 rounded-full">FULL TIME</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold">{m.homeTeam.name}</span>
                        <span className="text-lg font-bold text-maroon px-3">{m.homeScore} - {m.awayScore}</span>
                        <span className="text-sm font-semibold text-right">{m.awayTeam.name}</span>
                      </div>
                      <p className="text-[11px] text-muted mb-3">{m.venue}</p>
                      <button
                        onClick={() => deleteMatch(m.id)}
                        className="btn-touch text-xs text-red-600 font-medium bg-red-50 px-3 py-1.5 rounded-lg active:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matches.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted text-sm mb-4">No matches yet</p>
                <button
                  onClick={() => setTab("add")}
                  className="btn-touch bg-maroon text-white text-sm font-semibold px-6 py-2.5 rounded-full active:scale-95"
                >
                  Add First Match
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
