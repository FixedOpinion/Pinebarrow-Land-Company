"use client";

import { useEffect } from "react";

export default function GameEngineLoader() {
  useEffect(() => {
    const root = document.getElementById("pinebarrow-visible-menu-demo");
    if (!root || root.dataset.engineLoaded === "true") return;

    const engineScript = document.createElement("script");
    engineScript.src = "/pinebarrow-engine.js";
    engineScript.async = true;
    engineScript.dataset.pinebarrowEngine = "true";

    const loadMineManagement = () => {
      if (document.querySelector("script[data-pinebarrow-mine-management='true']")) return;
      const managementScript = document.createElement("script");
      managementScript.src = "/pinebarrow-mine-management.js";
      managementScript.async = true;
      managementScript.dataset.pinebarrowMineManagement = "true";
      document.body.appendChild(managementScript);
    };

    engineScript.addEventListener("load", loadMineManagement, { once: true });
    document.body.appendChild(engineScript);

    return () => {
      engineScript.removeEventListener("load", loadMineManagement);
    };
  }, []);

  return null;
}
