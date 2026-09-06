"use client";

import { useEffect } from "react";

export default function GameEngineLoader() {
  useEffect(() => {
    const root = document.getElementById("pinebarrow-visible-menu-demo");
    if (!root || root.dataset.engineLoaded === "true") return;

    const loadEngine = () => {
      if (root.dataset.engineLoaded === "true" || root.dataset.engineLoading === "true") return;
      root.dataset.engineLoading = "true";
      const script = document.createElement("script");
      script.src = "/pinebarrow-engine.js";
      script.async = true;
      script.dataset.pinebarrowEngine = "true";
      document.body.appendChild(script);
    };

    const loadFootprints = () => {
      const footprints = document.createElement("script");
      footprints.src = "/pinebarrow-footprints.js";
      footprints.type = "module";
      footprints.async = true;
      footprints.dataset.pinebarrowFootprints = "true";
      footprints.addEventListener("load", loadEngine, { once: true });
      footprints.addEventListener("error", loadEngine, { once: true });
      document.body.appendChild(footprints);
    };

    const placement = document.createElement("script");
    placement.src = "/pinebarrow-placement.js";
    placement.type = "module";
    placement.async = true;
    placement.dataset.pinebarrowPlacement = "true";
    placement.addEventListener("load", loadFootprints, { once: true });
    placement.addEventListener("error", loadFootprints, { once: true });
    document.body.appendChild(placement);
  }, []);

  return null;
}
