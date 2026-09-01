import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const loaderPath = new URL("../app/game-engine-loader.tsx", import.meta.url);
const managementPath = new URL("../public/pinebarrow-mine-management.js", import.meta.url);

test("Phase 3A loader attaches mine management after the game engine", async () => {
  const loader = await readFile(loaderPath, "utf8");
  assert.match(loader, /pinebarrow-engine\.js/);
  assert.match(loader, /pinebarrow-mine-management\.js/);
  assert.match(loader, /engineScript\.addEventListener\("load", loadMineManagement/);
});

test("Phase 3A mine management remains read-only and reports existing mine fields", async () => {
  const source = await readFile(managementPath, "utf8");
  assert.match(source, /Mine Management/);
  assert.match(source, /save\.mines/);
  assert.match(source, /save\.warehouses/);
  assert.match(source, /save\.hauls/);
  assert.match(source, /mine\.stockMaterial/);
  assert.match(source, /mine\.stockDirt/);
  assert.match(source, /production and hauling logic unchanged/);
  assert.doesNotMatch(source, /state\.mines\.push/);
  assert.doesNotMatch(source, /state\.cash\s*[-+]=/);
});
