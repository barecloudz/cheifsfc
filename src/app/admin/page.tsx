"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminMatchForm from "@/components/AdminMatchForm";

interface Team {
  id: number;
  name: string;
  manualWon: number;
  manualDrawn: number;
  manualLost: number;
  manualGF: number;
  manualGA: number;
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
  cancelled: boolean;
  cancelReason: string | null;
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

interface PlayerData {
  id: number;
  name: string;
  position: string;
  number: number | null;
  imageUrl: string | null;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  cardType: string;
}

interface SiteSettingsData {
  teamPhotoUrl: string | null;
  playerCardsOn: boolean;
  cardTypes: string;
}

type Tab = "dashboard" | "schedule" | "add" | "table" | "team";

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-fadeInUp">
      <div className="bg-foreground text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {message}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [scoreInputs, setScoreInputs] = useState<Record<number, { home: string; away: string }>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [saving, setSaving] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  // Edit match state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ date: "", time: "", venue: "", homeTeamId: "", awayTeamId: "" });

  // Table management state
  const [newTeamName, setNewTeamName] = useState("");
  const [addingTeam, setAddingTeam] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [statForm, setStatForm] = useState({ won: "0", drawn: "0", lost: "0", gf: "0", ga: "0" });
  const [savingStats, setSavingStats] = useState(false);
  const [quickHome, setQuickHome] = useState("");
  const [quickAway, setQuickAway] = useState("");
  const [quickHomeScore, setQuickHomeScore] = useState("");
  const [quickAwayScore, setQuickAwayScore] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);

  // Team management state
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettingsData>({ teamPhotoUrl: null, playerCardsOn: false, cardTypes: "[]" });
  const [newCardTypeValue, setNewCardTypeValue] = useState("");
  const [newCardTypeLabel, setNewCardTypeLabel] = useState("");
  const [uploadingTeamPhoto, setUploadingTeamPhoto] = useState(false);
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [uploadingPlayerPhoto, setUploadingPlayerPhoto] = useState(false);
  const [playerForm, setPlayerForm] = useState({
    name: "", position: "CM", number: "", imageUrl: "",
    pace: 50, shooting: 50, passing: 50, dribbling: 50, defending: 50, physical: 50,
    cardType: "default",
  });

  const showToast = useCallback((msg: string) => setToast(msg), []);

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
    fetch("/api/players").then((r) => r.json()).then(setPlayers);
    fetch("/api/settings").then((r) => r.json()).then(setSiteSettings);
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
    showToast("Score saved");
    loadData();
  }

  async function cancelMatch(matchId: number) {
    const reasons = ["Weather", "Waterlogged pitch", "Team no-show", "Other"];
    const reason = prompt(`Cancel reason?\n\n${reasons.map((r, i) => `${i + 1}. ${r}`).join("\n")}\n\nType a number or your own reason:`);
    if (reason === null) return;
    const idx = parseInt(reason) - 1;
    const finalReason = idx >= 0 && idx < reasons.length ? reasons[idx] : reason.trim() || "Cancelled";
    await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: matchId, cancelled: true, cancelReason: finalReason }),
    });
    showToast("Match cancelled");
    loadData();
  }

  async function uncancelMatch(matchId: number) {
    await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: matchId, cancelled: false, cancelReason: null }),
    });
    showToast("Match restored");
    loadData();
  }

  async function deleteMatch(matchId: number) {
    if (!confirm("Delete this match?")) return;
    await fetch("/api/matches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: matchId }),
    });
    showToast("Match deleted");
    loadData();
  }

  function startEdit(m: MatchData) {
    const d = new Date(m.date);
    const dateStr = d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
    const timeStr = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York" });
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
    showToast("Match updated");
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
      showToast("Team added");
      loadData();
    } else {
      const data = await res.json();
      showToast(data.error || "Failed to add team");
    }
  }

  async function deleteTeam(teamId: number, teamName: string) {
    if (!confirm(`Delete ${teamName}? This will also delete all their matches.`)) return;
    await fetch("/api/teams", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: teamId }),
    });
    showToast("Team removed");
    loadData();
  }

  function startEditStats(team: Team) {
    setStatForm({
      won: String(team.manualWon),
      drawn: String(team.manualDrawn),
      lost: String(team.manualLost),
      gf: String(team.manualGF),
      ga: String(team.manualGA),
    });
    setEditingTeamId(team.id);
  }

  async function saveStats(teamId: number) {
    setSavingStats(true);
    await fetch("/api/teams", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: teamId,
        manualWon: parseInt(statForm.won) || 0,
        manualDrawn: parseInt(statForm.drawn) || 0,
        manualLost: parseInt(statForm.lost) || 0,
        manualGF: parseInt(statForm.gf) || 0,
        manualGA: parseInt(statForm.ga) || 0,
      }),
    });
    setSavingStats(false);
    setEditingTeamId(null);
    showToast("Stats updated");
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
    showToast("Result recorded");
    loadData();
  }

  async function uploadToCloudinary(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "chiefs-unsigned");
    const res = await fetch("https://api.cloudinary.com/v1_1/djqdjdwma/image/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.secure_url || null;
  }

  async function handleTeamPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingTeamPhoto(true);
    try {
      const url = await uploadToCloudinary(file);
      if (url) {
        await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamPhotoUrl: url }),
        });
        setSiteSettings((s) => ({ ...s, teamPhotoUrl: url }));
        showToast("Team photo uploaded");
      } else {
        showToast("Upload failed");
      }
    } catch {
      showToast("Upload failed");
    }
    setUploadingTeamPhoto(false);
    e.target.value = "";
  }

  async function removeTeamPhoto() {
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamPhotoUrl: null }),
    });
    setSiteSettings((s) => ({ ...s, teamPhotoUrl: null }));
    showToast("Team photo removed");
  }

  async function togglePlayerCards(on: boolean) {
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerCardsOn: on }),
    });
    setSiteSettings((s) => ({ ...s, playerCardsOn: on }));
    showToast(on ? "Player cards enabled" : "Player cards disabled");
  }

  async function handlePlayerPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPlayerPhoto(true);
    try {
      const url = await uploadToCloudinary(file);
      if (url) {
        setPlayerForm((f) => ({ ...f, imageUrl: url }));
      } else {
        showToast("Upload failed");
      }
    } catch {
      showToast("Upload failed");
    }
    setUploadingPlayerPhoto(false);
    e.target.value = "";
  }

  function resetPlayerForm() {
    setPlayerForm({
      name: "", position: "CM", number: "", imageUrl: "",
      pace: 50, shooting: 50, passing: 50, dribbling: 50, defending: 50, physical: 50,
      cardType: "default",
    });
    setShowAddPlayer(false);
    setEditingPlayerId(null);
  }

  async function savePlayer() {
    if (!playerForm.name.trim() || !playerForm.position) return;
    setAddingPlayer(true);
    const payload = {
      name: playerForm.name.trim(),
      position: playerForm.position,
      number: playerForm.number ? parseInt(playerForm.number) : null,
      imageUrl: playerForm.imageUrl || null,
      pace: playerForm.pace,
      shooting: playerForm.shooting,
      passing: playerForm.passing,
      dribbling: playerForm.dribbling,
      defending: playerForm.defending,
      physical: playerForm.physical,
      cardType: playerForm.cardType,
    };

    if (editingPlayerId) {
      await fetch("/api/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingPlayerId, ...payload }),
      });
      showToast("Player updated");
    } else {
      await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      showToast("Player added");
    }
    setAddingPlayer(false);
    resetPlayerForm();
    loadData();
  }

  function startEditPlayer(p: PlayerData) {
    setPlayerForm({
      name: p.name,
      position: p.position,
      number: p.number ? String(p.number) : "",
      imageUrl: p.imageUrl || "",
      pace: p.pace,
      shooting: p.shooting,
      passing: p.passing,
      dribbling: p.dribbling,
      defending: p.defending,
      physical: p.physical,
      cardType: p.cardType || "default",
    });
    setEditingPlayerId(p.id);
    setShowAddPlayer(true);
  }

  async function deletePlayer(id: number, name: string) {
    if (!confirm(`Delete ${name}?`)) return;
    await fetch("/api/players", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    showToast("Player removed");
    loadData();
  }

  const positions = ["GK", "CB", "LB", "RB", "CM", "CDM", "CAM", "LW", "RW", "ST"];
  const customCardTypes: { value: string; label: string }[] = (() => {
    try { return JSON.parse(siteSettings.cardTypes); } catch { return []; }
  })();
  const cardTypes = [{ value: "default", label: "Default" }, ...customCardTypes];

  async function addCardType() {
    const val = newCardTypeValue.trim().toLowerCase().replace(/\s+/g, "-");
    const lbl = newCardTypeLabel.trim();
    if (!val || !lbl) return;
    if (cardTypes.some((ct) => ct.value === val)) {
      showToast("Card type already exists");
      return;
    }
    const updated = [...customCardTypes, { value: val, label: lbl }];
    const json = JSON.stringify(updated);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardTypes: json }),
    });
    setSiteSettings((s) => ({ ...s, cardTypes: json }));
    setNewCardTypeValue("");
    setNewCardTypeLabel("");
    showToast("Card type added");
  }

  async function removeCardType(value: string) {
    const updated = customCardTypes.filter((ct) => ct.value !== value);
    const json = JSON.stringify(updated);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardTypes: json }),
    });
    setSiteSettings((s) => ({ ...s, cardTypes: json }));
    showToast("Card type removed");
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-maroon border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-muted">Loading admin...</p>
        </div>
      </div>
    );
  }

  const upcoming = matches.filter((m) => m.homeScore === null).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const completed = matches.filter((m) => m.homeScore !== null).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const tabTitles: Record<Tab, string> = {
    dashboard: "Dashboard",
    schedule: "Manage Matches",
    add: "Add New Match",
    table: "Manage Table",
    team: "Manage Team",
  };

  const menuItems: { id: Tab; label: string; iconSvg: React.ReactNode }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      iconSvg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
    },
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
    {
      id: "team",
      label: "Manage Team",
      iconSvg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
    },
  ];

  const inputClass = "w-full bg-white border-2 border-card-border rounded-xl px-3 py-3 text-base text-center text-foreground font-bold focus:outline-none focus:border-maroon transition-colors";
  const selectClass = "w-full bg-white border border-card-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-maroon focus:ring-1 focus:ring-maroon/10 transition-colors";
  const labelClass = "block text-[10px] text-muted uppercase tracking-wider font-medium mb-1.5";

  return (
    <div className="min-h-screen bg-background">
      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast("")} />}

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col animate-[slideIn_0.2s_ease-out]">
            <div className="bg-maroon-gradient p-5 pb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-3 backdrop-blur-sm">
                <Image src="/logo.png" alt="Chiefs FC" width={36} height={36} />
              </div>
              <p className="text-white font-bold text-base">Chiefs FC</p>
              <p className="text-white/50 text-[11px] tracking-wider uppercase mt-0.5">Admin Panel</p>
            </div>

            <nav className="flex-1 py-3 px-2">
              <p className="text-[9px] text-muted uppercase tracking-[0.15em] font-semibold px-3 mb-2">Navigation</p>
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setTab(item.id); setSidebarOpen(false); window.scrollTo({ top: 0, behavior: "instant" }); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all mb-0.5 ${
                    tab === item.id
                      ? "bg-maroon/8 text-maroon font-semibold"
                      : "text-foreground-secondary hover:bg-background-secondary"
                  }`}
                >
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    tab === item.id ? "bg-maroon text-white shadow-sm shadow-maroon/20" : "bg-background-secondary text-muted"
                  }`}>
                    {item.iconSvg}
                  </span>
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-3 border-t border-card-border space-y-0.5">
              <button
                onClick={() => { setSidebarOpen(false); router.push("/"); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground-secondary active:opacity-70 rounded-xl hover:bg-background-secondary transition-colors"
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
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 active:opacity-70 rounded-xl hover:bg-red-50 transition-colors"
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

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div className="animate-fadeInUp space-y-4">
            {/* Welcome header */}
            <div className="card-premium overflow-hidden">
              <div className="bg-maroon-gradient p-5 pb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -mr-10 -mt-10" />
                <div className="absolute bottom-0 right-8 w-20 h-20 rounded-full bg-white/5 mb-[-10px]" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                      <Image src="/logo.png" alt="Chiefs FC" width={32} height={32} />
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-base">Chiefs FC</h2>
                      <p className="text-white/50 text-[11px] tracking-wider uppercase">Admin Dashboard</p>
                    </div>
                  </div>
                  <p className="text-white/70 text-xs leading-relaxed">Manage matches, update scores, and control the league table.</p>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Upcoming", value: upcoming.length, color: "text-gold-dark", bg: "bg-gold/10", iconColor: "var(--gold-dark)", icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></> },
                { label: "Completed", value: completed.length, color: "text-maroon", bg: "bg-maroon/8", iconColor: "var(--maroon)", icon: <><polyline points="20 6 9 17 4 12" /></> },
                { label: "Teams", value: teams.length, color: "text-foreground", bg: "bg-background-secondary", iconColor: "var(--muted)", icon: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></> },
              ].map((stat) => (
                <div key={stat.label} className={`${stat.bg} rounded-2xl p-3 text-center`}>
                  <div className="flex justify-center mb-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={stat.iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {stat.icon}
                    </svg>
                  </div>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-muted uppercase tracking-wider font-medium mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Next match highlight */}
            {upcoming.length > 0 && (() => {
              const next = upcoming[0];
              const matchDate = new Date(next.date);
              const now = new Date();
              const diffMs = matchDate.getTime() - now.getTime();
              const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
              const diffHours = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
              return (
                <div className="card-premium overflow-hidden">
                  <div className="h-1 bg-gold/40" />
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Next Match</h3>
                      </div>
                      <span className="text-[10px] font-semibold text-gold-dark bg-gold/10 px-2.5 py-1 rounded-full">
                        {diffDays > 0 ? `${diffDays}d ${diffHours}h` : diffHours > 0 ? `${diffHours}h` : "Today"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-center flex-1">
                        <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-1.5">
                          {next.homeTeam.name === "Chiefs FC" ? (
                            <Image src="/logo.png" alt="Chiefs FC" width={28} height={28} className="rounded-full" />
                          ) : (
                            <span className="text-xs font-bold text-gold-dark">{next.homeTeam.name.charAt(0)}</span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-foreground">{next.homeTeam.name}</p>
                      </div>
                      <div className="px-4">
                        <div className="text-center">
                          <p className="text-lg font-bold text-muted">vs</p>
                        </div>
                      </div>
                      <div className="text-center flex-1">
                        <div className="w-10 h-10 rounded-full bg-background-secondary border border-card-border flex items-center justify-center mx-auto mb-1.5">
                          {next.awayTeam.name === "Chiefs FC" ? (
                            <Image src="/logo.png" alt="Chiefs FC" width={28} height={28} className="rounded-full" />
                          ) : (
                            <span className="text-xs font-bold text-muted">{next.awayTeam.name.charAt(0)}</span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-foreground">{next.awayTeam.name}</p>
                      </div>
                    </div>
                    <div className="bg-background rounded-xl p-3 text-center">
                      <p className="text-xs text-muted font-medium">
                        {matchDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" })}
                        {" \u00B7 "}
                        {matchDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })}
                      </p>
                      <p className="text-[11px] text-muted/60 mt-0.5">{next.venue}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Recent results */}
            {completed.length > 0 && (
              <div className="card-premium overflow-hidden">
                <div className="h-1 bg-maroon/20" />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-maroon" />
                      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Recent Results</h3>
                    </div>
                    <button onClick={() => setTab("schedule")} className="text-[10px] text-maroon font-semibold active:opacity-70">
                      View All
                    </button>
                  </div>
                  <div className="space-y-0">
                    {completed.slice(0, 3).map((m) => {
                      const isChiefsHome = m.homeTeam.name === "Chiefs FC";
                      const isChiefsAway = m.awayTeam.name === "Chiefs FC";
                      const chiefsWin = (isChiefsHome && (m.homeScore ?? 0) > (m.awayScore ?? 0)) || (isChiefsAway && (m.awayScore ?? 0) > (m.homeScore ?? 0));
                      const chiefsDraw = m.homeScore === m.awayScore && (isChiefsHome || isChiefsAway);
                      const chiefsLoss = (isChiefsHome || isChiefsAway) && !chiefsWin && !chiefsDraw;
                      return (
                        <div key={m.id} className="flex items-center gap-3 py-2.5 border-b border-card-border last:border-0">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                            chiefsWin ? "bg-emerald-50 text-emerald-600" : chiefsLoss ? "bg-red-50 text-red-500" : chiefsDraw ? "bg-amber-50 text-amber-600" : "bg-background-secondary text-muted"
                          }`}>
                            {chiefsWin ? "W" : chiefsLoss ? "L" : chiefsDraw ? "D" : "\u00B7"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-foreground truncate">{m.homeTeam.name}</span>
                              <span className="text-xs font-bold text-foreground mx-2">{m.homeScore} - {m.awayScore}</span>
                              <span className="text-xs font-medium text-foreground truncate text-right">{m.awayTeam.name}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* League position */}
            {standings.length > 0 && (() => {
              const chiefsPos = standings.findIndex((t) => t.name === "Chiefs FC");
              const chiefsData = chiefsPos >= 0 ? standings[chiefsPos] : null;
              if (!chiefsData) return null;
              return (
                <div className="card-premium overflow-hidden">
                  <div className="h-1 bg-gold/40" />
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7" />
                          <path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7" />
                          <path d="M6 9h12v4a8 8 0 01-12 0V9z" />
                        </svg>
                      </span>
                      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">League Position</h3>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-maroon">{chiefsPos + 1}<span className="text-lg text-maroon/50">{chiefsPos === 0 ? "st" : chiefsPos === 1 ? "nd" : chiefsPos === 2 ? "rd" : "th"}</span></p>
                        <p className="text-[10px] text-muted uppercase tracking-wider font-medium mt-0.5">Position</p>
                      </div>
                      <div className="flex-1 grid grid-cols-4 gap-1">
                        {[
                          { label: "P", value: chiefsData.played },
                          { label: "W", value: chiefsData.won },
                          { label: "D", value: chiefsData.drawn },
                          { label: "L", value: chiefsData.lost },
                        ].map((s) => (
                          <div key={s.label} className="bg-background rounded-xl p-2 text-center">
                            <p className="text-sm font-bold text-foreground">{s.value}</p>
                            <p className="text-[9px] text-muted uppercase font-medium">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-card-border">
                      <span className="text-[11px] text-muted">{chiefsData.points} points \u00B7 GD {chiefsData.goalDifference > 0 ? "+" : ""}{chiefsData.goalDifference}</span>
                      <button onClick={() => setTab("table")} className="text-[10px] text-maroon font-semibold active:opacity-70">
                        Full Table
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTab("add")}
                className="card-premium overflow-hidden text-left active:scale-[0.98] transition-transform"
              >
                <div className="h-1 bg-maroon-gradient" />
                <div className="p-4">
                  <div className="w-9 h-9 rounded-xl bg-maroon/10 flex items-center justify-center mb-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-foreground">Add Match</p>
                  <p className="text-[11px] text-muted mt-0.5">Schedule a new game</p>
                </div>
              </button>
              <button
                onClick={() => setTab("table")}
                className="card-premium overflow-hidden text-left active:scale-[0.98] transition-transform"
              >
                <div className="h-1 bg-gold/40" />
                <div className="p-4">
                  <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center mb-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-foreground">Quick Result</p>
                  <p className="text-[11px] text-muted mt-0.5">Enter a match score</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ADD MATCH */}
        {tab === "add" && (
          <div className="card-premium overflow-hidden animate-fadeInUp">
            <div className="h-1 bg-maroon-gradient" />
            <div className="p-5">
              <AdminMatchForm teams={teams} onSuccess={() => { showToast("Match added"); loadData(); setTab("schedule"); }} />
            </div>
          </div>
        )}

        {/* MANAGE TABLE */}
        {tab === "table" && (
          <div className="space-y-4 animate-fadeInUp">
            {/* Quick Result Entry */}
            <div className="card-premium overflow-hidden">
              <div className="h-1 bg-maroon-gradient" />
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-7 h-7 rounded-lg bg-maroon/10 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </span>
                  <h2 className="text-sm font-bold text-foreground">Quick Result Entry</h2>
                </div>
                <p className="text-xs text-muted mb-4">Enter a result for any two teams to update the table.</p>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={labelClass}>Home Team</label>
                    <select value={quickHome} onChange={(e) => setQuickHome(e.target.value)} className={selectClass}>
                      <option value="">Select...</option>
                      {teams.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Away Team</label>
                    <select value={quickAway} onChange={(e) => setQuickAway(e.target.value)} className={selectClass}>
                      <option value="">Select...</option>
                      {teams.filter((t) => String(t.id) !== quickHome).map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                    </select>
                  </div>
                </div>

                <div className="flex items-end gap-2 mb-4">
                  <div className="flex-1">
                    <label className={labelClass}>
                      {quickHome ? teams.find((t) => String(t.id) === quickHome)?.name?.split(" ")[0] : "Home"}
                    </label>
                    <input type="number" min="0" placeholder="0" className={inputClass} value={quickHomeScore} onChange={(e) => setQuickHomeScore(e.target.value)} />
                  </div>
                  <span className="text-muted font-bold text-lg pb-3">-</span>
                  <div className="flex-1">
                    <label className={labelClass}>
                      {quickAway ? teams.find((t) => String(t.id) === quickAway)?.name?.split(" ")[0] : "Away"}
                    </label>
                    <input type="number" min="0" placeholder="0" className={inputClass} value={quickAwayScore} onChange={(e) => setQuickAwayScore(e.target.value)} />
                  </div>
                </div>

                <button
                  onClick={quickResult}
                  disabled={quickSaving || !quickHome || !quickAway || quickHomeScore === "" || quickAwayScore === "" || quickHome === quickAway}
                  className="btn-touch w-full bg-maroon-gradient text-white text-sm font-semibold py-3 rounded-xl active:scale-[0.98] disabled:opacity-40 shadow-sm shadow-maroon/15"
                >
                  {quickSaving ? "Saving..." : "Submit Result"}
                </button>
              </div>
            </div>

            {/* Current Standings */}
            <div className="card-premium overflow-hidden">
              <div className="h-1 bg-gold/40" />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7" />
                      <path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7" />
                      <path d="M6 9h12v4a8 8 0 01-12 0V9z" />
                    </svg>
                  </span>
                  <h2 className="text-sm font-bold text-foreground">Current Standings</h2>
                </div>
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
            </div>

            {/* Manage Teams */}
            <div className="card-premium overflow-hidden">
              <div className="h-1 bg-background-secondary" />
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-7 h-7 rounded-lg bg-background-secondary flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87" />
                      <path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  </span>
                  <h2 className="text-sm font-bold text-foreground">Manage Teams</h2>
                </div>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="New team name..."
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addTeam(); }}
                    className={selectClass + " flex-1"}
                  />
                  <button
                    onClick={addTeam}
                    disabled={addingTeam || !newTeamName.trim()}
                    className="btn-touch bg-maroon text-white text-sm font-semibold px-5 rounded-xl active:scale-95 disabled:opacity-40"
                  >
                    {addingTeam ? "..." : "Add"}
                  </button>
                </div>

                <div className="space-y-0.5">
                  {teams.map((team) => (
                    <div key={team.id} className="rounded-xl hover:bg-background-secondary transition-colors group">
                      <div className="flex items-center justify-between py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-background-secondary flex items-center justify-center text-[10px] font-bold text-muted group-hover:bg-white">
                            {team.name.charAt(0)}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">{team.name}</span>
                            {(team.manualWon > 0 || team.manualDrawn > 0 || team.manualLost > 0) && (
                              <p className="text-[10px] text-muted">+{team.manualWon}W {team.manualDrawn}D {team.manualLost}L manual</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => editingTeamId === team.id ? setEditingTeamId(null) : startEditStats(team)}
                            className="btn-touch text-[11px] text-maroon font-medium px-2 py-1 rounded-lg hover:bg-maroon/5 active:bg-maroon/10 transition-all"
                          >
                            {editingTeamId === team.id ? "Cancel" : "Edit Stats"}
                          </button>
                          <button
                            onClick={() => deleteTeam(team.id, team.name)}
                            className="btn-touch text-[11px] text-red-500 font-medium opacity-0 group-hover:opacity-100 hover:text-red-700 transition-all px-2 py-1 rounded-lg hover:bg-red-50 active:bg-red-100"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      {editingTeamId === team.id && (
                        <div className="px-3 pb-3">
                          <div className="bg-background rounded-xl p-3">
                            <p className="text-[10px] text-muted uppercase tracking-wider font-medium mb-2">Manual Stats (added to match results)</p>
                            <div className="grid grid-cols-5 gap-2 mb-3">
                              {[
                                { label: "W", key: "won" as const },
                                { label: "D", key: "drawn" as const },
                                { label: "L", key: "lost" as const },
                                { label: "GF", key: "gf" as const },
                                { label: "GA", key: "ga" as const },
                              ].map((field) => (
                                <div key={field.key}>
                                  <label className="block text-[9px] text-muted uppercase tracking-wider font-medium mb-1 text-center">{field.label}</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={statForm[field.key]}
                                    onChange={(e) => setStatForm((p) => ({ ...p, [field.key]: e.target.value }))}
                                    className="w-full bg-white border border-card-border rounded-lg px-2 py-2 text-sm text-center text-foreground font-bold focus:outline-none focus:border-maroon transition-colors"
                                  />
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => saveStats(team.id)}
                              disabled={savingStats}
                              className="btn-touch w-full bg-maroon-gradient text-white text-xs font-semibold py-2 rounded-lg active:scale-[0.98] disabled:opacity-50"
                            >
                              {savingStats ? "Saving..." : "Save Stats"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {teams.length === 0 && (
                  <p className="text-center text-muted text-sm py-4">No teams added yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MANAGE TEAM */}
        {tab === "team" && (
          <div className="space-y-4 animate-fadeInUp">
            {/* Team Photo Section */}
            <div className="card-premium overflow-hidden">
              <div className="h-1 bg-maroon-gradient" />
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-7 h-7 rounded-lg bg-maroon/10 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </span>
                  <h2 className="text-sm font-bold text-foreground">Team Photo</h2>
                </div>

                {siteSettings.teamPhotoUrl ? (
                  <div className="space-y-3">
                    <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-background-secondary">
                      <Image
                        src={siteSettings.teamPhotoUrl}
                        alt="Team photo"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 600px"
                      />
                    </div>
                    <div className="flex gap-2">
                      <label className="btn-touch flex-1 bg-background-secondary text-foreground text-sm font-semibold py-2.5 rounded-xl text-center cursor-pointer active:scale-[0.98]">
                        {uploadingTeamPhoto ? "Uploading..." : "Replace Photo"}
                        <input type="file" accept="image/*" className="hidden" onChange={handleTeamPhotoUpload} disabled={uploadingTeamPhoto} />
                      </label>
                      <button
                        onClick={removeTeamPhoto}
                        className="btn-touch px-4 bg-red-50 text-red-500 text-sm font-semibold rounded-xl active:scale-[0.98]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="block w-full border-2 border-dashed border-card-border rounded-xl p-8 text-center cursor-pointer hover:border-maroon/30 transition-colors">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <p className="text-sm font-medium text-foreground mb-1">
                      {uploadingTeamPhoto ? "Uploading..." : "Upload Team Photo"}
                    </p>
                    <p className="text-xs text-muted">Click to select an image</p>
                    <input type="file" accept="image/*" className="hidden" onChange={handleTeamPhotoUpload} disabled={uploadingTeamPhoto} />
                  </label>
                )}
              </div>
            </div>

            {/* Player Cards Toggle */}
            <div className="card-premium overflow-hidden">
              <div className="h-1 bg-gold/40" />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-foreground">Player Cards</h2>
                      <p className="text-[11px] text-muted">Show FUT-style cards on /team page</p>
                    </div>
                  </div>
                  <button
                    onClick={() => togglePlayerCards(!siteSettings.playerCardsOn)}
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      siteSettings.playerCardsOn ? "bg-maroon" : "bg-background-secondary"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        siteSettings.playerCardsOn ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Card Types Management */}
            <div className="card-premium overflow-hidden">
              <div className="h-1 bg-background-secondary" />
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-7 h-7 rounded-lg bg-background-secondary flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </span>
                  <h2 className="text-sm font-bold text-foreground">Card Types</h2>
                </div>

                <div className="space-y-1.5 mb-4">
                  {cardTypes.map((ct) => (
                    <div key={ct.value} className="flex items-center justify-between py-2 px-3 rounded-xl bg-background-secondary">
                      <div>
                        <span className="text-sm font-medium text-foreground">{ct.label}</span>
                        <span className="text-[10px] text-muted ml-2">{ct.value}</span>
                      </div>
                      {ct.value !== "default" && (
                        <button
                          onClick={() => removeCardType(ct.value)}
                          className="btn-touch text-[11px] text-red-500 font-medium px-2 py-1 rounded-lg hover:bg-red-50 active:bg-red-100 transition-all"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Value (e.g. gold)"
                    value={newCardTypeValue}
                    onChange={(e) => setNewCardTypeValue(e.target.value)}
                    className={selectClass + " flex-1"}
                  />
                  <input
                    type="text"
                    placeholder="Label (e.g. Gold)"
                    value={newCardTypeLabel}
                    onChange={(e) => setNewCardTypeLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addCardType(); }}
                    className={selectClass + " flex-1"}
                  />
                  <button
                    onClick={addCardType}
                    disabled={!newCardTypeValue.trim() || !newCardTypeLabel.trim()}
                    className="btn-touch bg-maroon text-white text-sm font-semibold px-5 rounded-xl active:scale-95 disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Player Management */}
            <div className="card-premium overflow-hidden">
              <div className="h-1 bg-background-secondary" />
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-background-secondary flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                    </span>
                    <h2 className="text-sm font-bold text-foreground">Players ({players.length})</h2>
                  </div>
                  <button
                    onClick={() => { resetPlayerForm(); setShowAddPlayer(true); }}
                    className="btn-touch text-xs font-semibold text-maroon bg-maroon/8 px-3 py-1.5 rounded-lg active:scale-95"
                  >
                    + Add Player
                  </button>
                </div>

                {/* Add/Edit Player Form */}
                {showAddPlayer && (
                  <div className="bg-background rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-foreground">{editingPlayerId ? "Edit Player" : "New Player"}</p>
                      <button onClick={resetPlayerForm} className="text-xs text-muted font-medium active:opacity-70">Cancel</button>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={labelClass}>Name</label>
                          <input
                            type="text"
                            value={playerForm.name}
                            onChange={(e) => setPlayerForm((f) => ({ ...f, name: e.target.value }))}
                            placeholder="Player name"
                            className={selectClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Position</label>
                          <select
                            value={playerForm.position}
                            onChange={(e) => setPlayerForm((f) => ({ ...f, position: e.target.value }))}
                            className={selectClass}
                          >
                            {positions.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={labelClass}>Jersey #</label>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={playerForm.number}
                            onChange={(e) => setPlayerForm((f) => ({ ...f, number: e.target.value }))}
                            placeholder="Optional"
                            className={selectClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Photo</label>
                          {playerForm.imageUrl ? (
                            <div className="flex items-center gap-2">
                              <div className="w-9 h-9 rounded-lg overflow-hidden bg-background-secondary">
                                <Image src={playerForm.imageUrl} alt="" width={36} height={36} className="w-full h-full object-cover" />
                              </div>
                              <button
                                onClick={() => setPlayerForm((f) => ({ ...f, imageUrl: "" }))}
                                className="text-[10px] text-red-500 font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <label className="block">
                              <span className={selectClass + " block text-center cursor-pointer text-muted"}>
                                {uploadingPlayerPhoto ? "Uploading..." : "Choose file"}
                              </span>
                              <input type="file" accept="image/*" className="hidden" onChange={handlePlayerPhotoUpload} disabled={uploadingPlayerPhoto} />
                            </label>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Card Type</label>
                        <select
                          value={playerForm.cardType}
                          onChange={(e) => setPlayerForm((f) => ({ ...f, cardType: e.target.value }))}
                          className={selectClass}
                        >
                          {cardTypes.map((ct) => (
                            <option key={ct.value} value={ct.value}>{ct.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Stats sliders */}
                      <div>
                        <label className={labelClass}>Stats</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2">
                          {[
                            { label: "PAC", key: "pace" as const },
                            { label: "SHO", key: "shooting" as const },
                            { label: "PAS", key: "passing" as const },
                            { label: "DRI", key: "dribbling" as const },
                            { label: "DEF", key: "defending" as const },
                            { label: "PHY", key: "physical" as const },
                          ].map((stat) => (
                            <div key={stat.key} className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-bold text-muted w-7 shrink-0">{stat.label}</span>
                              <input
                                type="range"
                                min="1"
                                max="99"
                                value={playerForm[stat.key]}
                                onChange={(e) => setPlayerForm((f) => ({ ...f, [stat.key]: parseInt(e.target.value) }))}
                                className="flex-1 min-w-0 accent-maroon h-1.5"
                              />
                              <span className="text-xs font-bold text-foreground w-6 text-right shrink-0">{playerForm[stat.key]}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={savePlayer}
                        disabled={addingPlayer || !playerForm.name.trim()}
                        className="btn-touch w-full bg-maroon-gradient text-white text-sm font-semibold py-2.5 rounded-xl active:scale-[0.98] disabled:opacity-40 shadow-sm shadow-maroon/15"
                      >
                        {addingPlayer ? "Saving..." : editingPlayerId ? "Update Player" : "Add Player"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Player list */}
                <div className="space-y-0.5">
                  {players.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-background-secondary transition-colors group">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-background-secondary flex items-center justify-center border border-card-border">
                          {p.imageUrl ? (
                            <Image src={p.imageUrl} alt={p.name} width={36} height={36} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-muted">{p.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{p.name}</p>
                          <p className="text-[10px] text-muted">
                            {p.position}
                            {p.number != null && ` · #${p.number}`}
                            {" · "}
                            {Math.round((p.pace + p.shooting + p.passing + p.dribbling + p.defending + p.physical) / 6)} OVR
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditPlayer(p)}
                          className="btn-touch text-[11px] text-maroon font-medium px-2 py-1 rounded-lg hover:bg-maroon/5 active:bg-maroon/10 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deletePlayer(p.id, p.name)}
                          className="btn-touch text-[11px] text-red-500 font-medium opacity-0 group-hover:opacity-100 hover:text-red-700 transition-all px-2 py-1 rounded-lg hover:bg-red-50 active:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {players.length === 0 && (
                    <p className="text-center text-muted text-sm py-6">No players added yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MANAGE MATCHES */}
        {tab === "schedule" && (
          <div className="animate-fadeInUp">
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                  <h2 className="text-sm font-bold text-foreground">Upcoming</h2>
                  <span className="text-[10px] text-muted font-medium ml-auto">{upcoming.length} match{upcoming.length !== 1 ? "es" : ""}</span>
                </div>
                <div className="space-y-3">
                  {upcoming.map((m) => (
                    <div key={m.id} className={`card-premium overflow-hidden ${m.cancelled ? "opacity-60" : ""}`}>
                      <div className={`h-1 ${m.cancelled ? "bg-gray-300" : "bg-gold/40"}`} />
                      <div className="p-4">
                      {editingId === m.id ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-maroon font-bold flex items-center gap-1.5">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Edit Match
                            </p>
                            <button onClick={() => setEditingId(null)} className="text-xs text-muted font-medium active:opacity-70 hover:text-foreground transition-colors">Cancel</button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className={labelClass}>Date</label>
                              <input type="date" value={editForm.date} onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))} className={selectClass} />
                            </div>
                            <div>
                              <label className={labelClass}>Time</label>
                              <input type="time" value={editForm.time} onChange={(e) => setEditForm((p) => ({ ...p, time: e.target.value }))} className={selectClass} />
                            </div>
                          </div>
                          <div>
                            <label className={labelClass}>Venue</label>
                            <input type="text" value={editForm.venue} onChange={(e) => setEditForm((p) => ({ ...p, venue: e.target.value }))} className={selectClass} />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className={labelClass}>Home Team</label>
                              <select value={editForm.homeTeamId} onChange={(e) => setEditForm((p) => ({ ...p, homeTeamId: e.target.value }))} className={selectClass}>
                                {teams.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                              </select>
                            </div>
                            <div>
                              <label className={labelClass}>Away Team</label>
                              <select value={editForm.awayTeamId} onChange={(e) => setEditForm((p) => ({ ...p, awayTeamId: e.target.value }))} className={selectClass}>
                                {teams.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                              </select>
                            </div>
                          </div>
                          <button
                            onClick={() => saveEdit(m.id)}
                            disabled={saving === m.id}
                            className="btn-touch w-full bg-maroon-gradient text-white text-sm font-semibold py-2.5 rounded-xl active:scale-[0.98] disabled:opacity-50 shadow-sm shadow-maroon/15"
                          >
                            {saving === m.id ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted font-medium">
                                {new Date(m.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/New_York" })}
                                {" \u00B7 "}
                                {new Date(m.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })}
                              </span>
                              {m.cancelled && (
                                <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                                  {m.cancelReason || "Cancelled"}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => startEdit(m)}
                              className="text-[10px] text-maroon font-semibold flex items-center gap-1 active:opacity-70 hover:underline"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Edit
                            </button>
                          </div>

                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm font-bold ${m.cancelled ? "text-gray-400 line-through" : "text-foreground"}`}>{m.homeTeam.name}</span>
                            <span className="text-xs text-muted font-semibold">vs</span>
                            <span className={`text-sm font-bold text-right ${m.cancelled ? "text-gray-400 line-through" : "text-foreground"}`}>{m.awayTeam.name}</span>
                          </div>
                          <p className="text-[11px] text-muted mb-3">{m.venue}</p>

                          {m.cancelled ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => uncancelMatch(m.id)}
                                className="btn-touch flex-1 bg-foreground text-white text-sm font-semibold py-2.5 rounded-xl active:scale-[0.98]"
                              >
                                Restore Match
                              </button>
                              <button
                                onClick={() => deleteMatch(m.id)}
                                className="btn-touch w-11 bg-red-50 text-red-500 rounded-xl flex items-center justify-center active:bg-red-100 hover:text-red-700 transition-colors"
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="bg-background rounded-xl p-3">
                              <p className="text-[10px] text-muted uppercase tracking-wider font-medium mb-2">Enter Final Score</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <label className="block text-[10px] text-muted mb-1">{m.homeTeam.name.split(" ")[0]}</label>
                                  <input type="number" min="0" placeholder="0" className={inputClass} value={scoreInputs[m.id]?.home ?? ""} onChange={(e) => setScoreInputs((p) => ({ ...p, [m.id]: { home: e.target.value, away: p[m.id]?.away ?? "" } }))} />
                                </div>
                                <span className="text-muted font-bold text-lg mt-5">-</span>
                                <div className="flex-1">
                                  <label className="block text-[10px] text-muted mb-1">{m.awayTeam.name.split(" ")[0]}</label>
                                  <input type="number" min="0" placeholder="0" className={inputClass} value={scoreInputs[m.id]?.away ?? ""} onChange={(e) => setScoreInputs((p) => ({ ...p, [m.id]: { home: p[m.id]?.home ?? "", away: e.target.value } }))} />
                                </div>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => submitScore(m.id)}
                                  disabled={saving === m.id}
                                  className="btn-touch flex-1 bg-maroon-gradient text-white text-sm font-semibold py-2.5 rounded-xl active:scale-[0.98] disabled:opacity-50 shadow-sm shadow-maroon/15"
                                >
                                  {saving === m.id ? "Saving..." : "Save Score"}
                                </button>
                                <button
                                  onClick={() => cancelMatch(m.id)}
                                  className="btn-touch w-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center active:bg-amber-100 hover:text-amber-700 transition-colors"
                                  title="Cancel match"
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => deleteMatch(m.id)}
                                  className="btn-touch w-11 bg-red-50 text-red-500 rounded-xl flex items-center justify-center active:bg-red-100 hover:text-red-700 transition-colors"
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="w-2 h-2 rounded-full bg-maroon" />
                  <h2 className="text-sm font-bold text-foreground">Completed</h2>
                  <span className="text-[10px] text-muted font-medium ml-auto">{completed.length} match{completed.length !== 1 ? "es" : ""}</span>
                </div>
                <div className="space-y-3">
                  {completed.map((m) => (
                    <div key={m.id} className="card-premium overflow-hidden">
                      <div className="h-1 bg-maroon/20" />
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted font-medium">
                            {new Date(m.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/New_York" })}
                          </span>
                          <span className="text-[10px] font-bold text-maroon bg-maroon/8 px-2.5 py-0.5 rounded-full">FT</span>
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold">{m.homeTeam.name}</span>
                          <span className="text-lg font-bold text-maroon px-3">{m.homeScore} - {m.awayScore}</span>
                          <span className="text-sm font-semibold text-right">{m.awayTeam.name}</span>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-card-border">
                          <p className="text-[11px] text-muted">{m.venue}</p>
                          <button
                            onClick={() => deleteMatch(m.id)}
                            className="text-[11px] text-red-500 font-medium active:opacity-70 hover:text-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matches.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-background-secondary flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <p className="text-foreground font-semibold text-sm mb-1">No matches yet</p>
                <p className="text-muted text-xs mb-5">Add your first match to get started</p>
                <button
                  onClick={() => setTab("add")}
                  className="btn-touch bg-maroon-gradient text-white text-sm font-semibold px-6 py-2.5 rounded-full active:scale-95 shadow-sm shadow-maroon/15"
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
