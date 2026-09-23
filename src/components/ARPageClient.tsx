"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useARCapabilities } from "@/hooks/useARCapabilities";
import type { Product } from "@/types/ar";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-900">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
    </div>
  ),
});

const ARViewer = dynamic(() => import("@/components/ARViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-black text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
        <span className="text-sm">Preparing AR…</span>
      </div>
    </div>
  ),
});

const FaceARViewer = dynamic(() => import("@/components/FaceARViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-black text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
        <span className="text-sm">Preparing try-on…</span>
      </div>
    </div>
  ),
});

function CheckingCapabilities() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-black text-white">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
      <p className="text-sm text-white/70">Checking AR support…</p>
    </div>
  );
}

function UnsupportedFallback({ product, reason }: { product: Product; reason?: string }) {
  const [show3D, setShow3D] = useState(false);

  if (show3D) {
    return (
      <div className="flex h-full w-full flex-col bg-zinc-950">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => setShow3D(false)}
            className="text-sm font-medium text-zinc-300"
          >
            ← Back
          </button>
          <span className="text-sm font-semibold text-zinc-100">{product.name} · 3D View</span>
          <span className="w-10" />
        </div>
        <div className="relative flex-1">
          <ModelViewer product={product} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
      <p className="text-lg font-semibold">AR is not supported on this device/browser.</p>
      <p className="max-w-xs text-sm text-white/70">
        {reason ?? "Try opening this demo on a compatible mobile browser."}
      </p>
      <button
        type="button"
        onClick={() => setShow3D(true)}
        className="mt-2 rounded-full bg-white px-8 py-4 text-base font-bold text-black"
      >
        View in 3D Instead
      </button>
      <Link href={`/product/${product.id}`} className="text-sm text-white/60 underline">
        Back to preview
      </Link>
    </div>
  );
}

export default function ARPageClient({ product }: { product: Product }) {
  const router = useRouter();
  const capabilities = useARCapabilities();

  const handleExit = useCallback(() => {
    router.push(`/product/${product.id}`);
  }, [router, product.id]);

  if (product.mode === "face") {
    return (
      <div className="fixed inset-0 h-dvh w-screen bg-black">
        <FaceARViewer product={product} onExit={handleExit} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 h-dvh w-screen bg-black">
      {!capabilities.checked && <CheckingCapabilities />}
      {capabilities.checked && !capabilities.isARSupported && (
        <UnsupportedFallback product={product} reason={capabilities.reason} />
      )}
      {capabilities.checked && capabilities.isARSupported && (
        <ARViewer product={product} onExit={handleExit} />
      )}
    </div>
  );
}
