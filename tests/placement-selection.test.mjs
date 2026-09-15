import assert from "node:assert/strict";
import test from "node:test";
import {
  beginSelection,
  cancelSelection,
  commitSelection,
  corridorCenterline,
  corridorCells,
  createPointerController,
  createRoadSegmentController,
  createSelectionSession,
  normalizeRectangle,
  orthogonalSegmentPoints,
  rectangleCells,
  rotateSelection,
  validateSelection,
} from "../public/pinebarrow-placement.js";

class PointerTarget {
  constructor() {
    this.listeners = new Map();
    this.style = {};
    this.captured = [];
    this.released = [];
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter((item) => item !== listener));
  }

  emit(type, event = {}) {
    for (const listener of this.listeners.get(type) ?? []) listener({ currentTarget: this, ...event });
  }

  setPointerCapture(pointerId) {
    this.captured.push(pointerId);
  }

  releasePointerCapture(pointerId) {
    this.released.push(pointerId);
  }
}

class EventTargetStub {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter((item) => item !== listener));
  }

  emit(type, event = {}) {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

function roadControllerHarness() {
  const target = new PointerTarget();
  const windowTarget = new EventTargetStub();
  const released = [];
  const anchors = [];
  const previews = [];
  const cancelled = [];
  const controller = createRoadSegmentController({
    dragThresholdPx: 12,
    windowTarget,
    toGrid: (event) => ({ x: event.tileX, y: event.tileY }),
    toClient: (event) => ({ x: event.clientX, y: event.clientY }),
    validatePoint: () => true,
    onStart: (anchor) => anchors.push(anchor),
    onPreview: (points) => previews.push(points),
    onRelease: (points) => released.push(points),
    onCancel: () => cancelled.push(true),
  });
  controller.attach(target);
  return { target, windowTarget, controller, anchors, previews, released, cancelled };
}

function roadPointer(pointerId, tileX, tileY, clientX, clientY) {
  return { pointerId, button: 0, tileX, tileY, clientX, clientY, preventDefault() {} };
}

test("area selection normalizes diagonal drags into an inclusive rectangle", () => {
  const rectangle = normalizeRectangle({ x: 8, y: 5 }, { x: 3, y: 2 });
  assert.deepEqual(rectangle, { x: 3, y: 2, w: 6, h: 4 });
  assert.equal(rectangleCells(rectangle).length, 24);
  assert.deepEqual(rectangleCells(rectangle)[0], { x: 3, y: 2 });
  assert.deepEqual(rectangleCells(rectangle).at(-1), { x: 8, y: 5 });
});

test("pointer controller captures, previews, commits, and releases a drag", () => {
  const target = new PointerTarget();
  const previews = [];
  const commits = [];
  const controller = createPointerController({
    mode: "area",
    limits: { maxShortSide: 2, maxLongSide: 10, maxArea: 20 },
    toGrid: (event) => ({ x: event.tileX, y: event.tileY }),
    onPreview: (_value, session) => previews.push({ ...session.geometry.rectangle }),
    onCommit: (value) => commits.push(value),
  });

  controller.attach(target);
  target.emit("pointerdown", { pointerId: 11, button: 0, tileX: 4, tileY: 8, preventDefault() {} });
  target.emit("pointermove", { pointerId: 11, tileX: 7, tileY: 9, preventDefault() {} });
  target.emit("pointerup", { pointerId: 11, tileX: 7, tileY: 9, preventDefault() {} });

  assert.deepEqual(target.captured, [11]);
  assert.deepEqual(target.released, [11]);
  assert.equal(previews.length, 1);
  assert.deepEqual(previews[0], { x: 4, y: 8, w: 4, h: 2, orientation: 0 });
  assert.equal(commits.length, 1);
  assert.deepEqual(commits[0].rectangle, { x: 4, y: 8, w: 4, h: 2, orientation: 0 });
  assert.equal(controller.session.status, "committed");
});

test("area validation rejects a footprint wider than the builder capability", () => {
  const session = createSelectionSession({
    mode: "area",
    limits: { maxShortSide: 2, maxLongSide: 10, maxArea: 20 },
  });
  beginSelection(session, { x: 10, y: 10 }, 2);
  session.cursor = { x: 13, y: 14 };
  session.geometry = { rectangle: normalizeRectangle(session.anchor, session.cursor), cells: [] };
  session.geometry.cells = rectangleCells(session.geometry.rectangle);
  const result = validateSelection(session, { limits: session.limits });
  assert.equal(result.valid, false);
  assert.equal(result.firstIssue.code, "short-side");
});

test("rotation changes the footprint orientation without changing its anchor", () => {
  const session = createSelectionSession({
    mode: "area",
    limits: { maxShortSide: 4, maxLongSide: 10, maxArea: 24 },
  });
  beginSelection(session, { x: 2, y: 3 }, 4);
  session.cursor = { x: 5, y: 4 };
  session.geometry = { rectangle: normalizeRectangle(session.anchor, session.cursor), cells: [] };
  session.geometry.cells = rectangleCells(session.geometry.rectangle);
  rotateSelection(session);
  assert.deepEqual(session.geometry.rectangle, { x: 2, y: 3, w: 2, h: 4, orientation: 90 });
  assert.equal(session.validation.valid, true);
});

test("corridor selection centers paving on the drawn line and keeps turns square", () => {
  assert.deepEqual(corridorCenterline([{ x: 1, y: 1 }, { x: 3, y: 3 }]), [
    { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 3, y: 3 },
  ]);
  const cells = corridorCells([{ x: 1, y: 1 }, { x: 3, y: 3 }], 2);
  assert.deepEqual(cells.map((cell) => `${cell.x},${cell.y}`).sort(), [
    "1,0", "1,1", "1,2", "2,0", "2,1", "2,2", "2,3", "3,1", "3,2", "3,3",
  ]);
  assert.ok(cells.some((cell) => cell.x === 1 && cell.y === 0), "paving reaches above the horizontal centerline");
  assert.ok(cells.some((cell) => cell.x === 1 && cell.y === 1), "paving reaches below the horizontal centerline");
});

test("four-wide corridors keep two paving tiles on each side of their centerline", () => {
  const cells = corridorCells([{ x: 8, y: 10 }, { x: 11, y: 10 }], 4);
  assert.equal(cells.length, 16);
  [8, 9, 10, 11].forEach((x) => {
    [8, 9, 10, 11].forEach((y) => {
      assert.ok(cells.some((cell) => cell.x === x && cell.y === y), `expected paving at ${x},${y}`);
    });
  });
  assert.equal(cells.some((cell) => cell.y === 7 || cell.y === 12), false);
});

test("ROAD-REGRESSION-001 — first touch horizontal explosion", () => {
  const road = roadControllerHarness();
  road.target.emit("pointerdown", roadPointer(31, 46, 122, 180, 220));
  road.target.emit("pointerup", roadPointer(31, 89, 122, 990, 220));
  assert.deepEqual(road.anchors, [{ x: 46, y: 122 }]);
  assert.equal(road.released.length, 0, "pointerup coordinates cannot manufacture a segment");
  assert.deepEqual(road.controller.session.candidate, []);
  assert.equal(road.controller.commit(), null);
});

test("road gestures require the CSS-pixel threshold and never resolve an equal diagonal as horizontal", () => {
  const belowThreshold = roadControllerHarness();
  belowThreshold.target.emit("pointerdown", roadPointer(32, 10, 10, 100, 100));
  belowThreshold.target.emit("pointermove", roadPointer(32, 15, 10, 106, 106));
  belowThreshold.target.emit("pointerup", roadPointer(32, 15, 10, 106, 106));
  assert.equal(belowThreshold.released.length, 0);
  assert.equal(belowThreshold.controller.session.axis, null);

  const exactTie = roadControllerHarness();
  exactTie.target.emit("pointerdown", roadPointer(33, 10, 10, 100, 100));
  exactTie.target.emit("pointermove", roadPointer(33, 30, 30, 120, 120));
  exactTie.target.emit("pointerup", roadPointer(33, 30, 30, 120, 120));
  assert.equal(exactTie.released.length, 0);
  assert.equal(exactTie.controller.session.axis, null, "an ambiguous diagonal has no forced axis");
});

test("road horizontal and vertical drags lock one axis despite finger wobble", () => {
  const horizontal = roadControllerHarness();
  horizontal.target.emit("pointerdown", roadPointer(34, 4, 8, 100, 100));
  horizontal.target.emit("pointermove", roadPointer(34, 7, 9, 140, 114));
  horizontal.target.emit("pointermove", roadPointer(34, 9, 14, 175, 170));
  horizontal.target.emit("pointerup", roadPointer(34, 9, 14, 175, 170));
  assert.equal(horizontal.controller.session.axis, "x");
  assert.deepEqual(horizontal.released[0], orthogonalSegmentPoints({ x: 4, y: 8 }, { x: 9, y: 8 }, "x"));

  const vertical = roadControllerHarness();
  vertical.target.emit("pointerdown", roadPointer(35, 12, 6, 200, 100));
  vertical.target.emit("pointermove", roadPointer(35, 13, 9, 210, 145));
  vertical.target.emit("pointermove", roadPointer(35, 19, 12, 280, 190));
  vertical.target.emit("pointerup", roadPointer(35, 19, 12, 280, 190));
  assert.equal(vertical.controller.session.axis, "y");
  assert.deepEqual(vertical.released[0], orthogonalSegmentPoints({ x: 12, y: 6 }, { x: 12, y: 12 }, "y"));
});

test("a released road candidate ignores unrelated touches until explicitly committed or redrawn", () => {
  const road = roadControllerHarness();
  road.target.emit("pointerdown", roadPointer(36, 2, 3, 50, 50));
  road.target.emit("pointermove", roadPointer(36, 5, 3, 100, 54));
  road.target.emit("pointerup", roadPointer(36, 5, 3, 100, 54));
  const candidate = road.controller.session.candidate.map((point) => ({ ...point }));
  road.target.emit("pointerdown", roadPointer(37, 40, 40, 500, 500));
  road.target.emit("pointermove", roadPointer(37, 60, 40, 800, 500));
  road.target.emit("pointerup", roadPointer(37, 60, 40, 800, 500));
  assert.deepEqual(road.controller.session.candidate, candidate);
  assert.equal(road.released.length, 1);
  assert.deepEqual(road.controller.commit()?.points, candidate);
});

test("pointer cancel, lost capture, and window blur discard road candidates instead of committing", () => {
  ["pointercancel", "lostpointercapture", "blur"].forEach((eventName, index) => {
    const road = roadControllerHarness();
    const pointerId = 40 + index;
    road.target.emit("pointerdown", roadPointer(pointerId, 5, 5, 100, 100));
    road.target.emit("pointermove", roadPointer(pointerId, 9, 5, 170, 103));
    if (eventName === "blur") road.windowTarget.emit("blur");
    else road.target.emit(eventName, roadPointer(pointerId, 9, 5, 170, 103));
    assert.equal(road.cancelled.length, 1, `${eventName} reports cancellation`);
    assert.deepEqual(road.controller.session.candidate, []);
    assert.equal(road.controller.commit(), null);
  });
});

test("pointer cancellation clears the transient selection without committing it", () => {
  const target = new PointerTarget();
  const cancelled = [];
  const controller = createPointerController({
    mode: "area",
    toGrid: (event) => ({ x: event.tileX, y: event.tileY }),
    onCancel: (_value, session) => cancelled.push(session.status),
  });
  controller.attach(target);
  target.emit("pointerdown", { pointerId: 12, button: 0, tileX: 2, tileY: 2, preventDefault() {} });
  target.emit("pointermove", { pointerId: 12, tileX: 5, tileY: 5, preventDefault() {} });
  target.emit("pointercancel", { pointerId: 12, preventDefault() {} });
  assert.deepEqual(cancelled, ["idle"]);
  assert.deepEqual(target.released, [12]);
  assert.equal(controller.session.anchor, null);
  assert.equal(controller.session.geometry.cells.length, 0);
  assert.equal(commitSelection(controller.session), null);
  cancelSelection(controller.session);
});
