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
  imageUrl,
  pace,
  shooting,
  passing,
  dribbling,
  defending,
  physical,
}: PlayerCardProps) {
  const rating = Math.round((pace + shooting + passing + dribbling + defending + physical) / 6);

  const leftStats = [
    { label: "PAC", value: pace },
    { label: "SHO", value: shooting },
    { label: "PAS", value: passing },
  ];
  const rightStats = [
    { label: "DRI", value: dribbling },
    { label: "DEF", value: defending },
    { label: "PHY", value: physical },
  ];

  return (
    <div className="fut-card">
      {/* Card frame PNG */}
      <Image
        src="/futcard.png"
        alt=""
        fill
        className="object-contain pointer-events-none select-none"
        sizes="220px"
        priority
      />

      {/* Content overlay */}
      <div className="fut-card-content">
        {/* === TOP HALF: Rating/Position left + Player image center === */}
        {/* Left column: Rating, Position, Logo */}
        <div className="absolute top-[8%] left-[9%] flex flex-col items-center z-10">
          <span className="text-[26px] font-black leading-none text-[#D4B04A] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {rating}
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#D4B04A] drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] -mt-0.5">
            {position}
          </span>
          <div className="w-5 h-[2px] bg-[#D4B04A]/40 my-1 rounded-full" />
          <Image
            src="/logo.png"
            alt="Chiefs FC"
            width={24}
            height={24}
            className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
          />
        </div>

        {/* Player image - transparent cutout */}
        <div className="absolute top-[4%] left-[20%] right-[4%] bottom-[46%] overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-contain object-bottom"
              sizes="200px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D4B04A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity={0.2}>
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
        </div>

        {/* === BOTTOM HALF: Name + Stats === */}
        <div className="absolute top-[52%] left-[8%] right-[8%] bottom-[6%] flex flex-col items-center">
          {/* Divider */}
          <div className="w-3/5 h-[1px] bg-gradient-to-r from-transparent via-[#D4B04A]/50 to-transparent mb-1" />

          {/* Player name */}
          <h3 className="text-[13px] font-black uppercase tracking-wider text-[#D4B04A] text-center leading-tight truncate max-w-full drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] mb-1">
            {name}
          </h3>

          {/* Divider */}
          <div className="w-4/5 h-[1px] bg-gradient-to-r from-transparent via-[#D4B04A]/40 to-transparent mb-1.5" />

          {/* Two-column stats */}
          <div className="flex w-full flex-1 items-start">
            {/* Left column */}
            <div className="flex-1 flex flex-col items-center gap-0">
              {leftStats.map((s) => (
                <div key={s.label} className="flex items-baseline gap-1">
                  <span className="text-[13px] font-black text-[#E8D5A3] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                    {s.value}
                  </span>
                  <span className="text-[8px] font-bold text-[#D4B04A]/60 uppercase">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Vertical divider */}
            <div className="w-[1px] h-[80%] bg-gradient-to-b from-transparent via-[#D4B04A]/40 to-transparent self-center" />

            {/* Right column */}
            <div className="flex-1 flex flex-col items-center gap-0">
              {rightStats.map((s) => (
                <div key={s.label} className="flex items-baseline gap-1">
                  <span className="text-[13px] font-black text-[#E8D5A3] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                    {s.value}
                  </span>
                  <span className="text-[8px] font-bold text-[#D4B04A]/60 uppercase">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
