"use client";

import { useEffect } from "react";

export default function GameEngineLoader() {
  useEffect(() => {
    const root = document.getElementById("pinebarrow-visible-menu-demo");
    if (!root || root.dataset.engineLoaded === "true") return;

    const script = document.createElement("script");
    script.src = "/pinebarrow-engine.js";
    script.async = true;
    script.dataset.pinebarrowEngine = "true";
    document.body.appendChild(script);
  }, []);

  return null;
}
