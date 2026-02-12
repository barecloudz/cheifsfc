"use client";

import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
}

export default function PageHeader({ title, showBack = false }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="app-header">
      <div className="w-full max-w-5xl mx-auto flex items-center">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="btn-touch w-10 h-10 -ml-2 mr-1 rounded-full flex items-center justify-center"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-bold">{title}</h1>
      </div>
    </div>
  );
}
