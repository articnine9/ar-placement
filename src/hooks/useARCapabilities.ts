"use client";

import { useEffect, useState } from "react";
import type { ARCapabilities } from "@/types/ar";

const initialState: ARCapabilities = {
  checked: false,
  isWebXRAvailable: false,
  isARSupported: false,
  isSecureContext: false,
};

/**
 * Detects real WebXR "immersive-ar" support in the current browser.
 * Runs only on the client since `navigator.xr` doesn't exist during SSR.
 */
export function useARCapabilities(): ARCapabilities {
  const [capabilities, setCapabilities] = useState<ARCapabilities>(initialState);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const isSecureContext =
        typeof window !== "undefined" && window.isSecureContext;

      if (!isSecureContext) {
        if (!cancelled) {
          setCapabilities({
            checked: true,
            isWebXRAvailable: typeof navigator !== "undefined" && "xr" in navigator,
            isARSupported: false,
            isSecureContext: false,
            reason:
              "This page must be served over HTTPS (or localhost) for AR and camera access to work.",
          });
        }
        return;
      }

      const isWebXRAvailable = typeof navigator !== "undefined" && "xr" in navigator;

      if (!isWebXRAvailable) {
        if (!cancelled) {
          setCapabilities({
            checked: true,
            isWebXRAvailable: false,
            isARSupported: false,
            isSecureContext,
            reason:
              "WebXR is not available in this browser. Try the latest Chrome on an ARCore-capable Android phone.",
          });
        }
        return;
      }

      try {
        const supported = await navigator.xr!.isSessionSupported("immersive-ar");
        if (!cancelled) {
          setCapabilities({
            checked: true,
            isWebXRAvailable: true,
            isARSupported: supported,
            isSecureContext,
            reason: supported
              ? undefined
              : "This device or browser doesn't support immersive AR sessions.",
          });
        }
      } catch {
        if (!cancelled) {
          setCapabilities({
            checked: true,
            isWebXRAvailable: true,
            isARSupported: false,
            isSecureContext,
            reason: "Could not determine AR support on this device.",
          });
        }
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return capabilities;
}
