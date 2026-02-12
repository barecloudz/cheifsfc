"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  targetDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(target: Date): TimeLeft | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const target = new Date(targetDate);
    setTimeLeft(getTimeLeft(target));

    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(target));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!mounted) {
    return <div className="text-gray text-sm">Loading...</div>;
  }

  if (!timeLeft) {
    return (
      <div className="bg-maroon/20 text-maroon-light font-bold text-sm px-4 py-2 rounded-full border border-maroon/30">
        Match Day!
      </div>
    );
  }

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hrs", value: timeLeft.hours },
    { label: "Min", value: timeLeft.minutes },
    { label: "Sec", value: timeLeft.seconds },
  ];

  return (
    <div className="flex gap-2.5">
      {units.map((unit) => (
        <div key={unit.label} className="text-center">
          <div className="bg-background-secondary border border-card-border rounded-lg px-3 py-2 min-w-[48px]">
            <span className="text-lg font-bold text-maroon">
              {String(unit.value).padStart(2, "0")}
            </span>
          </div>
          <span className="text-[10px] text-muted mt-1 block">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
