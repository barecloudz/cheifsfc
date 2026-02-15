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
      {/* Card frame image */}
      <Image
        src="/futcard.png"
        alt=""
        fill
        className="object-contain pointer-events-none select-none"
        sizes="200px"
        priority
      />

      {/* Content overlay */}
      <div className="fut-card-content">
        {/* Rating + Position column */}
        <div className="absolute left-[14%] top-[12%] flex flex-col items-center">
          <span className="text-[26px] font-black leading-none text-[#D4B04A] drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
            {rating}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#D4B04A]/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            {position}
          </span>
          {number != null && (
            <span className="text-[8px] font-bold text-[#D4B04A]/50 mt-0.5">#{number}</span>
          )}
        </div>

        {/* Player image - centered in upper area */}
        <div className="absolute top-[14%] left-1/2 -translate-x-1/2 w-[55%] aspect-square rounded-full overflow-hidden border-2 border-[#D4B04A]/25 bg-black/20 flex items-center justify-center">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              width={100}
              height={100}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D4B04A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.3}>
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </div>

        {/* Bottom section: name + stats */}
        <div className="absolute bottom-[8%] left-[10%] right-[10%] flex flex-col items-center">
          {/* Gold divider */}
          <div className="w-4/5 h-[1px] bg-gradient-to-r from-transparent via-[#D4B04A]/60 to-transparent mb-1.5" />

          {/* Player name */}
          <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#D4B04A] text-center leading-tight truncate max-w-full drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] mb-2">
            {name}
          </h3>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-x-4 gap-y-0 w-full">
            {[
              { label: "PAC", value: pace },
              { label: "SHO", value: shooting },
              { label: "PAS", value: passing },
              { label: "DRI", value: dribbling },
              { label: "DEF", value: defending },
              { label: "PHY", value: physical },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between">
                <span className="text-[7px] font-bold text-[#D4B04A]/50 uppercase">{stat.label}</span>
                <span className="text-[9px] font-black text-[#E8D5A3] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
