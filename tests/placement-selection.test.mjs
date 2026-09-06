import assert from "node:assert/strict";
import test from "node:test";
import {
  beginSelection,
  cancelSelection,
  commitSelection,
  corridorCells,
  createPointerController,
  createSelectionSession,
  normalizeRectangle,
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

test("corridor selection follows diagonal movement and expands to the configured width", () => {
  const cells = corridorCells([{ x: 1, y: 1 }, { x: 3, y: 3 }], 2);
  assert.deepEqual(cells, [
    { x: 1, y: 1 }, { x: 1, y: 2 },
    { x: 2, y: 1 }, { x: 2, y: 2 },
    { x: 2, y: 3 }, { x: 3, y: 2 },
    { x: 3, y: 3 }, { x: 4, y: 3 },
  ]);
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
  assert.equal(controller.session.anchor, null);
  assert.equal(controller.session.geometry.cells.length, 0);
  assert.equal(commitSelection(controller.session), null);
  cancelSelection(controller.session);
});
