"use client";

import Image from "next/image";

interface PlayerCardProps {
  name: string;
  position: string;
  number?: number | null;
  imageUrl?: string | null;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export default function PlayerCard({
  name,
  position,
  number,
  imageUrl,
  pace,
  shooting,
  passing,
  dribbling,
  defending,
  physical,
}: PlayerCardProps) {
  const rating = Math.round((pace + shooting + passing + dribbling + defending + physical) / 6);

  return (
    <div className="fut-card">
      {/* Card inner content */}
      <div className="relative flex flex-col items-center pt-3 pb-2 px-2">
        {/* Top row: Rating + Position */}
        <div className="flex items-start justify-between w-full px-1 mb-1">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black leading-none text-[#1a1a1a]">{rating}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#1a1a1a]/70">{position}</span>
          </div>
          {number != null && (
            <span className="text-[10px] font-bold text-[#1a1a1a]/50 mt-0.5">#{number}</span>
          )}
        </div>

        {/* Player image */}
        <div className="w-[80px] h-[80px] rounded-full overflow-hidden mb-2 border-2 border-[#B8942F]/30 bg-gradient-to-b from-[#B8942F]/10 to-[#7B1A2C]/10 flex items-center justify-center">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#7B1A2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.4}>
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </div>

        {/* Divider */}
        <div className="w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#B8942F]/40 to-transparent mb-1.5" />

        {/* Player name */}
        <h3 className="text-[11px] font-extrabold uppercase tracking-wide text-[#1a1a1a] mb-2 text-center leading-tight truncate max-w-full">
          {name}
        </h3>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 w-full px-1">
          {[
            { label: "PAC", value: pace },
            { label: "SHO", value: shooting },
            { label: "PAS", value: passing },
            { label: "DRI", value: dribbling },
            { label: "DEF", value: defending },
            { label: "PHY", value: physical },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center justify-between">
              <span className="text-[8px] font-bold text-[#1a1a1a]/50 uppercase">{stat.label}</span>
              <span className="text-[10px] font-black text-[#1a1a1a]">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
