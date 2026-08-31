"use client";

import { useEffect } from "react";
import { applyGameEnginePatches } from "./game-engine-patches";

export default function GameEngineLoader() {
  useEffect(() => {
    const root = document.getElementById("pinebarrow-visible-menu-demo");
    if (!root || root.dataset.engineLoaded === "true") return;

    let cancelled = false;

    async function loadGame() {
      try {
        const response = await fetch("/pinebarrow-engine.js", { cache: "no-store" });
        if (!response.ok) throw new Error(`Engine request failed (${response.status})`);
        const source = await response.text();
        const patchedSource = applyGameEnginePatches(source);
        if (cancelled) return;

        const engineScript = document.createElement("script");
        engineScript.text = patchedSource;
        engineScript.dataset.pinebarrowEngine = "true";
        document.body.appendChild(engineScript);

        const managementScript = document.createElement("script");
        managementScript.src = "/pinebarrow-management-v2.js";
        managementScript.async = false;
        managementScript.dataset.pinebarrowManagement = "true";
        document.body.appendChild(managementScript);
      } catch (error) {
        console.error("Pinebarrow engine initialization failed", error);
        const status = root.querySelector("#pb7-map-tip");
        if (status) status.textContent = "Game initialization failed. Reload to retry.";
      }
    }

    loadGame();
    return () => { cancelled = true; };
  }, []);

  return null;
}
