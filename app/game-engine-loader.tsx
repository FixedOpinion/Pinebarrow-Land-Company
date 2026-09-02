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

    const loadManagement = () => {
      if (!document.querySelector("script[data-pinebarrow-mine-management='true']")) {
        const mineScript = document.createElement("script");
        mineScript.src = "/pinebarrow-mine-management.js";
        mineScript.async = true;
        mineScript.dataset.pinebarrowMineManagement = "true";
        document.body.appendChild(mineScript);
      }

      if (!document.querySelector("script[data-pinebarrow-operations-management='true']")) {
        const operationsScript = document.createElement("script");
        operationsScript.src = "/pinebarrow-operations-management.js";
        operationsScript.async = true;
        operationsScript.dataset.pinebarrowOperationsManagement = "true";
        document.body.appendChild(operationsScript);
      }
    };

    engineScript.addEventListener("load", loadManagement, { once: true });
    document.body.appendChild(engineScript);

    return () => {
      engineScript.removeEventListener("load", loadManagement);
    };
  }, []);

  return null;
}
