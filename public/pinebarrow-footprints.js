import { rectangleMetrics } from "./pinebarrow-placement.js";

// C2.2 configuration is intentionally data-first.  Balance changes belong here,
// not in the shared pointer or project-ledger code.
export const BUILDER_CAPABILITIES = Object.freeze([
  Object.freeze({ id: "builder-i", label: "Builder I", level: 1, maxShortSide: 2, maxLongSide: 2 }),
  Object.freeze({ id: "builder-ii", label: "Builder II", level: 3, maxShortSide: 2, maxLongSide: 4 }),
  Object.freeze({ id: "builder-iii", label: "Builder III", level: 5, maxShortSide: 2, maxLongSide: 6 }),
  Object.freeze({ id: "master-builder", label: "Master Builder", level: 7, maxShortSide: 2, maxLongSide: 8 }),
  Object.freeze({ id: "city-builder", label: "City Builder", level: 8, maxShortSide: 2, maxLongSide: 10 }),
  Object.freeze({ id: "city-planner", label: "City Planner", level: 10, maxShortSide: 4, maxLongSide: 10 }),
]);

export const FOOTPRINT_DESIGNS = Object.freeze({
  "worker-house": Object.freeze({
    id: "worker-house", label: "Workforce House", category: "residential", baseW: 2, baseH: 2,
    requiredBuilderLevel: 1, requiredRole: null, baseMaterials: 12, baseLabor: 8, baseCost: 120, baseDays: 2,
  }),
  "expanded-house": Object.freeze({
    id: "expanded-house", label: "Expanded House", category: "residential", baseW: 2, baseH: 3,
    requiredBuilderLevel: 3, requiredRole: null, baseMaterials: 18, baseLabor: 12, baseCost: 220, baseDays: 3,
  }),
  "family-house": Object.freeze({
    id: "family-house", label: "Family House", category: "residential", baseW: 2, baseH: 4,
    requiredBuilderLevel: 5, requiredRole: null, baseMaterials: 28, baseLabor: 18, baseCost: 360, baseDays: 4,
  }),
  "row-house": Object.freeze({
    id: "row-house", label: "Row/Boarding House", category: "residential", baseW: 2, baseH: 6,
    requiredBuilderLevel: 7, requiredRole: null, baseMaterials: 42, baseLabor: 28, baseCost: 560, baseDays: 6,
  }),
  "mine-starter": Object.freeze({
    id: "mine-starter", label: "Starter Mine", category: "mine", baseW: 2, baseH: 2,
    requiredBuilderLevel: 1, requiredRole: null, baseMaterials: 20, baseLabor: 12, baseCost: 260, baseDays: 3,
  }),
  "mine-yard": Object.freeze({
    id: "mine-yard", label: "Mine Yard", category: "mine", baseW: 2, baseH: 4,
    requiredBuilderLevel: 3, requiredRole: null, baseMaterials: 36, baseLabor: 24, baseCost: 520, baseDays: 5,
  }),
  "warehouse-starter": Object.freeze({
    id: "warehouse-starter", label: "Starter Warehouse", category: "warehouse", baseW: 2, baseH: 2,
    requiredBuilderLevel: 1, requiredRole: null, baseMaterials: 18, baseLabor: 10, baseCost: 240, baseDays: 3,
  }),
  "warehouse-expanded": Object.freeze({
    id: "warehouse-expanded", label: "Expanded Warehouse", category: "warehouse", baseW: 2, baseH: 4,
    requiredBuilderLevel: 3, requiredRole: null, baseMaterials: 34, baseLabor: 22, baseCost: 480, baseDays: 5,
  }),
  "player-market": Object.freeze({
    id: "player-market", label: "Player Market", category: "market", baseW: 2, baseH: 6,
    requiredBuilderLevel: 5, requiredRole: null, baseMaterials: 54, baseLabor: 34, baseCost: 780, baseDays: 7,
  }),
  "research-facility": Object.freeze({
    id: "research-facility", label: "Research Facility", category: "research", baseW: 4, baseH: 6,
    requiredBuilderLevel: 10, requiredRole: "city-planner", requiresSchool: true, requiresResearchUnlock: true,
    baseMaterials: 96, baseLabor: 72, baseCost: 1600, baseDays: 12,
  }),
});

export const ESTIMATE_RULES = Object.freeze({
  perimeterLaborFactor: 0.25,
  frontageLaborFactor: 0.5,
  materialRound: "ceil",
  laborRound: "ceil",
  costRound: "ceil",
  daysRound: "ceil",
  defaultBuilderDurationMultiplier: 1,
  defaultRouteDistance: 1,
  defaultFrontage: 1,
});

function integer(value, fallback = 0) {
  return Number.isFinite(value) ? Math.round(value) : fallback;
}

function positive(value, fallback = 1) {
  return Math.max(1, Number.isFinite(value) ? value : fallback);
}

export function getFootprintDesign(designId) {
  return FOOTPRINT_DESIGNS[designId] || null;
}

export function getBuilderCapability(level = 0) {
  return BUILDER_CAPABILITIES.filter((capability) => capability.level <= integer(level)).at(-1) || null;
}

export function builderCanExecute(designOrId, footprint, builderLevel = 0) {
  const design = typeof designOrId === "string" ? getFootprintDesign(designOrId) : designOrId;
  const metrics = rectangleMetrics(footprint);
  const capability = getBuilderCapability(builderLevel);
  if (!design || !capability || builderLevel < design.requiredBuilderLevel) {
    return { valid: false, code: "builder-level", message: `Requires builder level ${design?.requiredBuilderLevel || "unknown"}.`, capability };
  }
  if (metrics.shortSide > capability.maxShortSide || metrics.longSide > capability.maxLongSide) {
    return { valid: false, code: "builder-footprint", message: `${capability.label} cannot execute this footprint.`, capability };
  }
  return { valid: true, code: null, message: "Builder qualification passed.", capability };
}

export function requiredBuilderFor(designOrId, footprint) {
  const design = typeof designOrId === "string" ? getFootprintDesign(designOrId) : designOrId;
  const metrics = rectangleMetrics(footprint);
  if (!design) return null;
  return BUILDER_CAPABILITIES.find((capability) =>
    capability.level >= design.requiredBuilderLevel
      && metrics.shortSide <= capability.maxShortSide
      && metrics.longSide <= capability.maxLongSide) || null;
}

export function estimateFootprint(designOrId, footprint, options = {}) {
  const design = typeof designOrId === "string" ? getFootprintDesign(designOrId) : designOrId;
  if (!design || !footprint) return null;
  const metrics = rectangleMetrics(footprint);
  const baseArea = positive(design.baseW * design.baseH);
  const areaRatio = positive(metrics.area / baseArea);
  const frontage = positive(options.frontage, ESTIMATE_RULES.defaultFrontage);
  const routeDistance = positive(options.routeDistance, ESTIMATE_RULES.defaultRouteDistance);
  const durationMultiplier = positive(options.builderDurationMultiplier, ESTIMATE_RULES.defaultBuilderDurationMultiplier);
  const laborRatio = areaRatio + (metrics.perimeter / (2 * (design.baseW + design.baseH))) * ESTIMATE_RULES.perimeterLaborFactor
    + frontage * ESTIMATE_RULES.frontageLaborFactor / baseArea;
  const materials = Math.ceil(design.baseMaterials * areaRatio);
  const labor = Math.ceil(design.baseLabor * laborRatio);
  const logistics = Math.ceil(materials * routeDistance);
  const logisticsRate = Number.isFinite(options.logisticsRate) ? options.logisticsRate : 0;
  const cost = Math.ceil(design.baseCost * areaRatio + logistics * logisticsRate);
  const days = Math.ceil(design.baseDays * areaRatio * durationMultiplier);
  return { area: metrics.area, perimeter: metrics.perimeter, frontage, routeDistance, materials, labor, logistics, cost, days };
}

export function createProposalSnapshot(input = {}) {
  const design = typeof input.designId === "string" ? getFootprintDesign(input.designId) : input.design;
  if (!design || !input.footprint) return null;
  const footprint = {
    x: integer(input.footprint.x), y: integer(input.footprint.y), w: integer(input.footprint.w), h: integer(input.footprint.h),
    orientation: integer(input.footprint.orientation),
  };
  const estimate = estimateFootprint(design, footprint, input);
  const qualification = builderCanExecute(design, footprint, input.builderLevel || 0);
  const requiredBuilder = requiredBuilderFor(design, footprint);
  return Object.freeze({
    snapshotVersion: 1,
    designId: design.id,
    category: design.category,
    mode: input.mode || "area",
    sourceRoute: input.sourceRoute || null,
    footprint,
    cells: (input.cells || []).map((cell) => ({ x: integer(cell.x), y: integer(cell.y) })),
    frontageCells: (input.frontageCells || []).map((cell) => ({ x: integer(cell.x), y: integer(cell.y) })),
    lotId: input.lotId || null,
    blockId: input.blockId || null,
    surveyCellIds: [...(input.surveyCellIds || [])],
    requiredBuilderLevel: design.requiredBuilderLevel,
    requiredRole: design.requiredRole || null,
    requiresSchool: Boolean(design.requiresSchool),
    requiresResearchUnlock: Boolean(design.requiresResearchUnlock),
    requiredBuilder: requiredBuilder?.id || null,
    qualification,
    estimate,
    status: qualification.valid ? "draft" : "blocked",
  });
}

const api = {
  BUILDER_CAPABILITIES, FOOTPRINT_DESIGNS, ESTIMATE_RULES, getFootprintDesign, getBuilderCapability,
  builderCanExecute, requiredBuilderFor, estimateFootprint, createProposalSnapshot,
};

if (typeof globalThis !== "undefined" && globalThis.window) globalThis.window.PinebarrowFootprints = api;
