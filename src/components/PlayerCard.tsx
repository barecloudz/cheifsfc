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
  cardType?: string;
  cardImageUrl?: string;
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
  cardType = "default",
  cardImageUrl,
}: PlayerCardProps) {
  const rating = Math.round((pace + shooting + passing + dribbling + defending + physical) / 6);
  const cardImage = cardImageUrl || (cardType === "default" ? "/futcard.png" : `/futcard-${cardType}.png`);

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
        src={cardImage}
        alt=""
        fill
        className="object-contain pointer-events-none select-none"
        sizes="220px"
        priority
      />

      {/* Content overlay - inset to match frame boundaries */}
      {/* Frame visible area: ~12% left, ~9% top, ~14% right, ~10% bottom */}
      <div className="fut-card-content">

        {/* Rating + Position + Logo - top left inside frame */}
        <div className="absolute top-[21%] left-[19%] flex flex-col items-center z-10">
          <span className="fut-text-lg font-black leading-none text-[#D4B04A] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {rating}
          </span>
          <span className="fut-text-xs font-extrabold uppercase tracking-wide text-[#D4B04A] drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
            {position}
          </span>
          <div className="fut-divider-sm bg-[#D4B04A]/40 my-[3%] rounded-full" />
          <Image
            src="/logo.png"
            alt="Chiefs FC"
            width={20}
            height={20}
            className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] fut-logo"
          />
        </div>

        {/* Player image cutout - upper right portion of frame */}
        <div className="absolute top-[18%] left-[32%] right-[15%] bottom-[44%] overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-contain object-bottom"
              sizes="180px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4B04A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity={0.2}>
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
        </div>

        {/* Bottom section: Name + Stats - inside frame */}
        <div className="absolute top-[52%] left-[16%] right-[16%] bottom-[12%] flex flex-col items-center">
          {/* Divider */}
          <div className="w-3/5 h-[1px] bg-gradient-to-r from-transparent via-[#D4B04A]/50 to-transparent mb-[2%]" />

          {/* Player name */}
          <h3 className="fut-text-name font-black uppercase tracking-wider text-[#D4B04A] text-center leading-tight truncate max-w-full drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] [text-shadow:0_0_8px_rgba(0,0,0,0.8),0_0_16px_rgba(0,0,0,0.5)] mb-[2%]">
            {name}
          </h3>

          {/* Divider */}
          <div className="w-4/5 h-[1px] bg-gradient-to-r from-transparent via-[#D4B04A]/40 to-transparent mb-[3%]" />

          {/* Two-column stats */}
          <div className="flex w-full flex-1 items-start">
            {/* Left column */}
            <div className="flex-1 flex flex-col items-center gap-0">
              {leftStats.map((s) => (
                <div key={s.label} className="flex items-baseline gap-[2px]">
                  <span className="fut-text-stat font-black text-[#E8D5A3] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                    {s.value}
                  </span>
                  <span className="fut-text-label font-bold text-[#D4B04A]/60 uppercase">
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
                <div key={s.label} className="flex items-baseline gap-[2px]">
                  <span className="fut-text-stat font-black text-[#E8D5A3] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                    {s.value}
                  </span>
                  <span className="fut-text-label font-bold text-[#D4B04A]/60 uppercase">
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
