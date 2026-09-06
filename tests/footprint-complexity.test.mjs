import assert from "node:assert/strict";
import test from "node:test";
import {
  builderCanExecute,
  createProposalSnapshot,
  estimateFootprint,
  getFootprintDesign,
  requiredBuilderFor,
} from "../public/pinebarrow-footprints.js";

test("builder bands qualify the documented 2x2, 2x4, and 2x10 layouts", () => {
  assert.equal(builderCanExecute("worker-house", { w: 2, h: 2 }, 1).valid, true);
  assert.equal(builderCanExecute("mine-yard", { w: 2, h: 4 }, 3).valid, true);
  assert.equal(builderCanExecute("mine-yard", { w: 2, h: 4 }, 1).valid, false);
  assert.equal(builderCanExecute("player-market", { w: 2, h: 10 }, 8).valid, true);
  assert.equal(builderCanExecute("player-market", { w: 2, h: 10 }, 7).valid, false);
});

test("4x6 research facility requires City Planner and research prerequisites", () => {
  const design = getFootprintDesign("research-facility");
  assert.equal(design.requiredRole, "city-planner");
  assert.equal(builderCanExecute(design, { w: 4, h: 6 }, 10).valid, true);
  assert.equal(requiredBuilderFor(design, { w: 4, h: 6 }).id, "city-planner");
});

test("larger footprints scale estimates without mutating the base design", () => {
  const design = getFootprintDesign("worker-house");
  const estimate = estimateFootprint(design, { w: 2, h: 4 }, { frontage: 2, routeDistance: 3 });
  assert.equal(estimate.area, 8);
  assert.equal(estimate.materials, 24);
  assert.equal(design.baseW, 2);
  assert.equal(design.baseH, 2);
});

test("proposal snapshots preserve geometry, access, prerequisites, and estimates", () => {
  const snapshot = createProposalSnapshot({
    designId: "mine-yard",
    mode: "area",
    sourceRoute: "town-hall-site-approval",
    footprint: { x: 4, y: 7, w: 2, h: 4, orientation: 0 },
    cells: [{ x: 4, y: 7 }, { x: 5, y: 10 }],
    frontageCells: [{ x: 3, y: 7 }],
    surveyCellIds: ["survey-1", "survey-2"],
    lotId: "lot-3",
    blockId: "block-a",
    builderLevel: 3,
    frontage: 1,
  });
  assert.equal(snapshot.status, "draft");
  assert.equal(snapshot.designId, "mine-yard");
  assert.equal(snapshot.requiredBuilder, "builder-ii");
  assert.deepEqual(snapshot.footprint, { x: 4, y: 7, w: 2, h: 4, orientation: 0 });
  assert.deepEqual(snapshot.frontageCells, [{ x: 3, y: 7 }]);
  assert.equal(snapshot.estimate.area, 8);
  assert.deepEqual(snapshot.surveyCellIds, ["survey-1", "survey-2"]);
});
