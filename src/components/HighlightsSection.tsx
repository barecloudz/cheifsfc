"use client";

import { useState } from "react";

interface Highlight {
  id: number;
  title: string;
  videoUrl: string;
  thumbnail: string | null;
}

interface HighlightsSectionProps {
  highlights: Highlight[];
}

export default function HighlightsSection({ highlights }: HighlightsSectionProps) {
  const [playingId, setPlayingId] = useState<number | null>(null);

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
        {highlights.map((h) => (
          <button
            key={h.id}
            onClick={() => setPlayingId(h.id)}
            className="shrink-0 w-52 snap-start group"
          >
            <div className="relative aspect-video rounded-xl overflow-hidden bg-foreground/5 border border-card-border">
              {h.thumbnail ? (
                <img
                  src={h.thumbnail}
                  alt={h.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-maroon/20 to-maroon/5 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              )}
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-active:scale-90 transition-transform">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--maroon)" stroke="none">
                    <polygon points="6 3 20 12 6 21 6 3" />
                  </svg>
                </div>
              </div>
            </div>
            <p className="text-xs font-medium text-foreground mt-2 text-left truncate">{h.title}</p>
          </button>
        ))}
      </div>

      {/* Fullscreen video modal */}
      {playingId !== null && (() => {
        const highlight = highlights.find((h) => h.id === playingId);
        if (!highlight) return null;
        return (
          <div
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setPlayingId(null)}
          >
            <button
              onClick={() => setPlayingId(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
              <video
                src={highlight.videoUrl}
                controls
                autoPlay
                className="w-full rounded-xl"
                playsInline
              />
              <p className="text-white text-sm font-medium mt-3 text-center">{highlight.title}</p>
            </div>
          </div>
        );
      })()}
    </>
  );
}
