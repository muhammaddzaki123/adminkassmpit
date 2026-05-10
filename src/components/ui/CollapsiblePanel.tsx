"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsiblePanelProps {
  title?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function CollapsiblePanel({ title, defaultOpen = true, children, className = "" }: CollapsiblePanelProps) {
  const [open, setOpen] = useState<boolean>(defaultOpen);

  useEffect(() => {
    // sensible default: collapsed on small screens, open on larger screens
    if (typeof window !== "undefined") {
      const width = window.innerWidth;
      if (width < 768) setOpen(false);
      else setOpen(true);
    }
  }, []);

  return (
    <div className={`rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-neutral-900 font-semibold">{title}</div>
        <button
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-50"
        >
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {open ? "Sembunyikan" : "Tampilkan"}
        </button>
      </div>

      {open && <div className="pt-2">{children}</div>}
    </div>
  );
}
