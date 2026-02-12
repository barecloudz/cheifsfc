"use client";

import { useState } from "react";

interface Team {
  id: number;
  name: string;
}

interface AdminMatchFormProps {
  teams: Team[];
  onSuccess: () => void;
}

export default function AdminMatchForm({ teams, onSuccess }: AdminMatchFormProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [fieldName, setFieldName] = useState("");
  const [address, setAddress] = useState("");
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const venue = address ? `${fieldName}, ${address}` : fieldName;
    const dateTime = new Date(`${date}T${time}:00`);
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: dateTime.toISOString(),
        venue,
        homeTeamId: parseInt(homeTeamId),
        awayTeamId: parseInt(awayTeamId),
      }),
    });

    setLoading(false);
    if (res.ok) {
      setDate("");
      setTime("19:00");
      setFieldName("");
      setAddress("");
      setHomeTeamId("");
      setAwayTeamId("");
      onSuccess();
    }
  }

  const inputClass =
    "w-full bg-background border border-card-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-maroon focus:ring-1 focus:ring-maroon/10";

  const labelClass = "block text-xs font-medium text-muted mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Time</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} required />
        </div>
      </div>
      <div>
        <label className={labelClass}>Field #</label>
        <input type="text" value={fieldName} onChange={(e) => setFieldName(e.target.value)} className={inputClass} placeholder="e.g. JBL Field 3" required />
      </div>
      <div>
        <label className={labelClass}>Address</label>
        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="e.g. 498 Azalea Rd E, Asheville, NC" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Home Team</label>
          <select value={homeTeamId} onChange={(e) => setHomeTeamId(e.target.value)} className={inputClass} required>
            <option value="">Select...</option>
            {teams.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Away Team</label>
          <select value={awayTeamId} onChange={(e) => setAwayTeamId(e.target.value)} className={inputClass} required>
            <option value="">Select...</option>
            {teams.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn-touch w-full bg-maroon text-white font-semibold rounded-xl py-3 text-sm disabled:opacity-50 active:scale-[0.98]"
      >
        {loading ? "Adding..." : "Add Match"}
      </button>
    </form>
  );
}
