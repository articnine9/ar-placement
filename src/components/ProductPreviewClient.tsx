"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { Product } from "@/types/ar";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-900">
      <div className="flex flex-col items-center gap-3 text-zinc-500 dark:text-zinc-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-300" />
        <span className="text-sm">Loading 3D model…</span>
      </div>
    </div>
  ),
});

export default function ProductPreviewClient({ product }: { product: Product }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-zinc-600 active:bg-zinc-100 dark:text-zinc-300 dark:active:bg-zinc-800"
          aria-label="Back to product list"
        >
          ←
        </Link>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Product Preview</p>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{product.name}</h1>
        </div>
      </header>

      <div className="relative min-h-[50vh] flex-1">
        <ModelViewer product={product} />
      </div>

      <div className="flex flex-col items-center gap-4 border-t border-zinc-200 bg-white px-4 py-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex gap-3">
          <span className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            ↻ Drag to rotate
          </span>
          <span className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            🔍 Pinch / scroll to zoom
          </span>
        </div>

        <Link
          href={`/ar/${product.id}`}
          className="flex min-h-16 w-full max-w-sm items-center justify-center rounded-2xl bg-zinc-900 px-6 text-lg font-semibold text-white shadow-sm active:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:active:bg-zinc-200"
        >
          {product.mode === "face" ? "Try It On" : "View in AR"}
        </Link>
      </div>
    </div>
  );
}
