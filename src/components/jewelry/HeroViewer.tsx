"use client";

import dynamic from "next/dynamic";

const NecklaceShowcase = dynamic(() => import("./NecklaceShowcase"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border border-brand-gold/30 border-t-brand-gold" />
      <span className="text-[11px] uppercase tracking-[0.25em] text-brand-muted">Preparing 3D view</span>
    </div>
  ),
});

export default function HeroViewer() {
  return (
    <div className="hero-canvas absolute inset-0">
      <NecklaceShowcase />
    </div>
  );
}
