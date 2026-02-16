"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import PlayerCard from "@/components/PlayerCard";

interface Player {
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

interface Settings {
  teamPhotoUrl: string | null;
  playerCardsOn: boolean;
  cardTypes: string;
}

export default function TeamPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/players").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([playersData, settingsData]) => {
      setPlayers(playersData);
      setSettings(settingsData);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-maroon border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-muted">Loading team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-maroon-gradient px-5 pt-4 pb-8 text-white rounded-b-[32px] mb-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-1">Meet the Team</h1>
          <p className="text-white/60 text-sm">Chiefs FC Squad</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-1 md:px-4">
        {/* Team Photo */}
        {settings?.teamPhotoUrl && (
          <div className="card-premium overflow-hidden mb-8 animate-fadeInUp">
            <div className="relative w-full aspect-[16/9]">
              <Image
                src={settings.teamPhotoUrl}
                alt="Chiefs FC Team Photo"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1024px"
                priority
              />
            </div>
          </div>
        )}

        {/* Player Cards */}
        {settings?.playerCardsOn && players.length > 0 && (
          <div className="animate-fadeInUp">
            <div className="flex items-center gap-2 mb-5 px-1">
              <span className="w-2 h-2 rounded-full bg-gold" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">The Squad</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-5 md:justify-items-center">
              {(() => {
                const cardTypeImageMap: Record<string, string> = {};
                try {
                  const parsed = JSON.parse(settings?.cardTypes || "[]");
                  for (const ct of parsed) {
                    if (ct.value && ct.imageUrl) cardTypeImageMap[ct.value] = ct.imageUrl;
                  }
                } catch { /* ignore */ }
                return players.map((player) => (
                  <div key={player.id} className="w-full">
                  <PlayerCard
                    name={player.name}
                    position={player.position}
                    number={player.number}
                    imageUrl={player.imageUrl}
                    pace={player.pace}
                    shooting={player.shooting}
                    passing={player.passing}
                    dribbling={player.dribbling}
                    defending={player.defending}
                    physical={player.physical}
                    cardType={player.cardType}
                    cardImageUrl={cardTypeImageMap[player.cardType]}
                  />
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!settings?.teamPhotoUrl && (!settings?.playerCardsOn || players.length === 0) && (
          <div className="text-center py-20 animate-fadeInUp">
            <div className="w-16 h-16 rounded-2xl bg-background-secondary flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <p className="text-foreground font-semibold text-sm mb-1">Team info coming soon</p>
            <p className="text-muted text-xs">Check back for player cards and team photos!</p>
          </div>
        )}
      </div>
    </div>
  );
}
