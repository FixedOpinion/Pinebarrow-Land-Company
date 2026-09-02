"use client";

import { useEffect } from "react";
import { applyWorkforceEnginePatches } from "./workforce-engine-patches";

export default function GameEngineLoader() {
  useEffect(() => {
    const root = document.getElementById("pinebarrow-visible-menu-demo");
    if (!root || root.dataset.engineLoaded === "true") return;

    let cancelled = false;
    let engineScript: HTMLScriptElement | null = null;

    const loadScriptOnce = (src: string, dataAttribute: string) => {
      if (document.querySelector(`script[${dataAttribute}='true']`)) return;
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.setAttribute(dataAttribute, "true");
      document.body.appendChild(script);
    };

    const loadManagement = () => {
      loadScriptOnce("/pinebarrow-mine-management.js", "data-pinebarrow-mine-management");
      loadScriptOnce("/pinebarrow-operations-management.js", "data-pinebarrow-operations-management");
      loadScriptOnce("/pinebarrow-workforce-management.js", "data-pinebarrow-workforce-management");
    };

    const boot = async () => {
      try {
        const response = await fetch("/pinebarrow-engine.js", { cache: "no-store" });
        if (!response.ok) throw new Error(`Engine request failed: ${response.status}`);
        const originalSource = await response.text();
        const patchedSource = applyWorkforceEnginePatches(originalSource);
        if (cancelled) return;

        engineScript = document.createElement("script");
        engineScript.text = `${patchedSource}\n//# sourceURL=pinebarrow-engine.workforce-patched.js`;
        engineScript.dataset.pinebarrowEngine = "true";
        document.body.appendChild(engineScript);
        loadManagement();
      } catch (error) {
        console.error("Pinebarrow engine failed to initialize", error);
        const mapTip = document.getElementById("pb7-map-tip");
        if (mapTip) mapTip.textContent = "Game engine could not start. Refresh to retry.";
      }
    };

    void boot();

    return () => {
      cancelled = true;
      if (engineScript && engineScript.parentNode) engineScript.parentNode.removeChild(engineScript);
    };
  }, []);

  return null;
}
