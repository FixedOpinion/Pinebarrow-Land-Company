const DEFAULT_LIMITS = Object.freeze({
  minWidth: 1,
  minHeight: 1,
  maxShortSide: 2,
  maxLongSide: 2,
  maxArea: 4,
});

const DEFAULT_ROAD_SEGMENT_OPTIONS = Object.freeze({
  dragThresholdPx: 12,
});

function integer(value, fallback = 0) {
  return Number.isFinite(value) ? Math.round(value) : fallback;
}

function point(value) {
  return { x: integer(value?.x), y: integer(value?.y) };
}

function pointKey(value) {
  return `${value.x},${value.y}`;
}

function screenPoint(value) {
  return {
    x: Number.isFinite(value?.x) ? Number(value.x) : 0,
    y: Number.isFinite(value?.y) ? Number(value.y) : 0,
  };
}

function uniquePoints(points) {
  const seen = new Set();
  return points.reduce((result, value) => {
    const next = point(value);
    const key = pointKey(next);
    if (seen.has(key)) return result;
    seen.add(key);
    result.push(next);
    return result;
  }, []);
}

function normalizeLimits(limits = {}) {
  return {
    ...DEFAULT_LIMITS,
    ...limits,
    minWidth: Math.max(1, integer(limits.minWidth, DEFAULT_LIMITS.minWidth)),
    minHeight: Math.max(1, integer(limits.minHeight, DEFAULT_LIMITS.minHeight)),
    maxShortSide: Math.max(1, integer(limits.maxShortSide, DEFAULT_LIMITS.maxShortSide)),
    maxLongSide: Math.max(1, integer(limits.maxLongSide, DEFAULT_LIMITS.maxLongSide)),
    maxArea: Math.max(1, integer(limits.maxArea, DEFAULT_LIMITS.maxArea)),
  };
}

export function normalizeRectangle(anchor, cursor) {
  const start = point(anchor);
  const end = point(cursor || anchor);
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(end.x - start.x) + 1,
    h: Math.abs(end.y - start.y) + 1,
  };
}

export function rectangleCells(rectangle) {
  if (!rectangle) return [];
  const cells = [];
  for (let y = rectangle.y; y < rectangle.y + rectangle.h; y += 1) {
    for (let x = rectangle.x; x < rectangle.x + rectangle.w; x += 1) {
      cells.push({ x, y });
    }
  }
  return cells;
}

export function rectangleMetrics(rectangle) {
  if (!rectangle) return { area: 0, perimeter: 0, shortSide: 0, longSide: 0 };
  const width = Math.max(0, integer(rectangle.w));
  const height = Math.max(0, integer(rectangle.h));
  return {
    area: width * height,
    perimeter: width && height ? 2 * (width + height) : 0,
    shortSide: Math.min(width, height),
    longSide: Math.max(width, height),
  };
}

export function rotateRectangle(rectangle, orientation = 0) {
  if (!rectangle) return null;
  const turns = Math.abs(integer(orientation / 90)) % 2;
  return {
    x: integer(rectangle.x),
    y: integer(rectangle.y),
    w: turns ? rectangle.h : rectangle.w,
    h: turns ? rectangle.w : rectangle.h,
    orientation: turns ? 90 : 0,
  };
}

function gridSegment(start, end) {
  const points = [];
  let x = start.x;
  let y = start.y;
  const stepX = Math.sign(end.x - start.x);
  const stepY = Math.sign(end.y - start.y);
  points.push({ x, y });
  while (x !== end.x || y !== end.y) {
    const remainingX = Math.abs(end.x - x);
    const remainingY = Math.abs(end.y - y);
    if (remainingX >= remainingY && x !== end.x) x += stepX;
    else if (y !== end.y) y += stepY;
    points.push({ x, y });
  }
  return points;
}

export function corridorCenterline(points) {
  const route = uniquePoints(points || []);
  if (!route.length) return [];
  const centerline = [];
  route.forEach((next, index) => {
    if (!index) centerline.push(next);
    else centerline.push(...gridSegment(centerline[centerline.length - 1], next).slice(1));
  });
  return centerline;
}

function centeredOffsets(width) {
  const laneWidth = Math.max(1, integer(width, 2));
  const tilesBeforeCenterline = Math.floor(laneWidth / 2);
  return Array.from({ length: laneWidth }, (_value, index) => index - tilesBeforeCenterline);
}

export function corridorCells(points, width = 2) {
  const centerline = corridorCenterline(points);
  if (!centerline.length) return [];
  const laneWidth = Math.max(1, integer(width, 2));
  const offsets = centeredOffsets(laneWidth);
  const cells = new Map();
  const add = (cell) => cells.set(pointKey(cell), cell);
  if (centerline.length === 1) {
    offsets.forEach((offset) => add({ x: centerline[0].x + offset, y: centerline[0].y }));
    return Array.from(cells.values());
  }
  for (let index = 1; index < centerline.length; index += 1) {
    const start = centerline[index - 1];
    const end = centerline[index];
    if (start.y === end.y) {
      const firstX = Math.min(start.x, end.x);
      const lastX = Math.max(start.x, end.x);
      for (let x = firstX; x <= lastX; x += 1) {
        offsets.forEach((offset) => add({ x, y: start.y + offset }));
      }
    } else {
      const firstY = Math.min(start.y, end.y);
      const lastY = Math.max(start.y, end.y);
      for (let y = firstY; y <= lastY; y += 1) {
        offsets.forEach((offset) => add({ x: start.x + offset, y }));
      }
    }
  }
  return Array.from(cells.values());
}

export function orthogonalSegmentPoints(start, end, axis) {
  if (!start || !end || (axis !== "x" && axis !== "y")) return [];
  const anchor = point(start);
  const cursor = point(end);
  const horizontal = axis === "x";
  const distance = horizontal ? Math.abs(cursor.x - anchor.x) : Math.abs(cursor.y - anchor.y);
  const step = Math.sign(horizontal ? cursor.x - anchor.x : cursor.y - anchor.y);
  const points = [];
  for (let offset = 0; offset <= distance; offset += 1) {
    points.push(horizontal
      ? { x: anchor.x + step * offset, y: anchor.y }
      : { x: anchor.x, y: anchor.y + step * offset });
  }
  return points;
}

export function createRoadSegmentSession(options = {}) {
  return {
    status: "idle",
    pointerId: null,
    anchor: null,
    anchorClient: null,
    axis: null,
    endpoint: null,
    candidate: [],
    validation: { valid: false, issue: null },
    dragThresholdPx: Math.max(1, Number(options.dragThresholdPx) || DEFAULT_ROAD_SEGMENT_OPTIONS.dragThresholdPx),
  };
}

export function beginRoadSegment(session, anchor, client, pointerId = null) {
  if (!session || !anchor) return null;
  session.status = "dragging";
  session.pointerId = pointerId;
  session.anchor = point(anchor);
  session.anchorClient = screenPoint(client);
  session.axis = null;
  session.endpoint = null;
  session.candidate = [];
  session.validation = { valid: false, issue: null };
  return session;
}

function roadSegmentIssue(candidate, options) {
  if (typeof options.validatePoint === "function") {
    const blocked = candidate.find((candidatePoint) => options.validatePoint(candidatePoint) !== true);
    if (blocked) return { code: "blocked-cell", cell: blocked, message: `Tile ${blocked.x},${blocked.y} cannot be selected.` };
  }
  if (typeof options.validateSegment === "function") {
    const result = options.validateSegment(candidate);
    if (result !== true && result != null) {
      if (typeof result === "string") return { code: "blocked-segment", message: result };
      return { code: result.code || "blocked-segment", ...result };
    }
  }
  return null;
}

export function updateRoadSegment(session, cursor, client, options = {}) {
  if (!session || session.status !== "dragging" || !session.anchor) return session;
  const currentClient = screenPoint(client);
  const deltaX = currentClient.x - session.anchorClient.x;
  const deltaY = currentClient.y - session.anchorClient.y;
  if (!session.axis) {
    if (Math.hypot(deltaX, deltaY) < session.dragThresholdPx) return session;
    const horizontalDistance = Math.abs(deltaX);
    const verticalDistance = Math.abs(deltaY);
    if (horizontalDistance === verticalDistance) return session;
    session.axis = horizontalDistance > verticalDistance ? "x" : "y";
  }
  const current = point(cursor);
  const endpoint = session.axis === "x"
    ? { x: current.x, y: session.anchor.y }
    : { x: session.anchor.x, y: current.y };
  const candidate = orthogonalSegmentPoints(session.anchor, endpoint, session.axis);
  if (candidate.length < 2) {
    session.endpoint = null;
    session.candidate = [];
    session.validation = { valid: false, issue: null };
    return session;
  }
  const issue = roadSegmentIssue(candidate, options);
  session.endpoint = endpoint;
  session.candidate = candidate;
  session.validation = { valid: !issue, issue };
  return session;
}

export function cancelRoadSegment(session) {
  if (!session) return null;
  session.status = "idle";
  session.pointerId = null;
  session.anchor = null;
  session.anchorClient = null;
  session.axis = null;
  session.endpoint = null;
  session.candidate = [];
  session.validation = { valid: false, issue: null };
  return session;
}

export function commitRoadSegment(session) {
  if (!session || session.status !== "candidate" || !session.validation.valid || session.candidate.length < 2) return null;
  session.status = "committed";
  session.pointerId = null;
  return {
    axis: session.axis,
    anchor: point(session.anchor),
    endpoint: point(session.endpoint),
    points: session.candidate.map(point),
  };
}

export function createRoadSegmentController(options = {}) {
  const session = options.session || createRoadSegmentSession(options);
  let target = null;
  let windowTarget = null;
  let detach = null;

  function toGrid(event) {
    return typeof options.toGrid === "function" ? options.toGrid(event) : { x: event.tileX, y: event.tileY };
  }

  function toClient(event) {
    return typeof options.toClient === "function"
      ? options.toClient(event)
      : { x: Number(event.clientX) || 0, y: Number(event.clientY) || 0 };
  }

  function emit(name, value) {
    const callback = options[name];
    if (typeof callback === "function") callback(value, session);
  }

  function pointerMatches(event) {
    return session.pointerId == null || event?.pointerId == null || session.pointerId === event.pointerId;
  }

  function releasePointer(event) {
    if (session.pointerId == null) return;
    const captureTarget = event?.currentTarget || target;
    if (captureTarget?.releasePointerCapture) {
      try { captureTarget.releasePointerCapture(session.pointerId); } catch {}
    }
  }

  function onPointerDown(event) {
    if ((event.button != null && event.button !== 0) || !["idle", "cancelled"].includes(session.status)) return;
    const touched = toGrid(event);
    const anchor = typeof options.resolveAnchor === "function" ? options.resolveAnchor(touched, event, session) : touched;
    if (!anchor) {
      emit("onRejectedStart", touched);
      return;
    }
    event.preventDefault?.();
    beginRoadSegment(session, anchor, toClient(event), event.pointerId ?? null);
    if (event.currentTarget?.setPointerCapture && event.pointerId != null) {
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch {}
    }
    emit("onStart", point(anchor));
  }

  function onPointerMove(event) {
    if (session.status !== "dragging" || !pointerMatches(event)) return;
    event.preventDefault?.();
    updateRoadSegment(session, toGrid(event), toClient(event), options);
    if (session.validation.issue) emit("onBlocked", session.validation);
    else emit("onPreview", session.candidate.map(point));
  }

  function onPointerUp(event) {
    if (session.status !== "dragging" || !pointerMatches(event)) return;
    event.preventDefault?.();
    const hasCandidate = session.candidate.length >= 2 && session.validation.valid;
    session.status = hasCandidate ? "candidate" : "anchored";
    releasePointer(event);
    session.pointerId = null;
    if (hasCandidate) {
      emit("onRelease", session.candidate.map(point));
      return;
    }
    emit("onAnchorOnly", session.anchor ? point(session.anchor) : null);
  }

  function cancelActive(event) {
    if (session.status !== "dragging") return;
    if (event?.pointerId != null && !pointerMatches(event)) return;
    event?.preventDefault?.();
    releasePointer(event);
    cancelRoadSegment(session);
    session.status = "cancelled";
    emit("onCancel", session);
  }

  function attach(nextTarget) {
    if (detach) detach();
    target = nextTarget;
    if (!target?.addEventListener) return () => {};
    windowTarget = options.windowTarget || target.ownerDocument?.defaultView || (typeof window !== "undefined" ? window : null);
    target.addEventListener("pointerdown", onPointerDown);
    target.addEventListener("pointermove", onPointerMove);
    target.addEventListener("pointerup", onPointerUp);
    target.addEventListener("pointercancel", cancelActive);
    target.addEventListener("lostpointercapture", cancelActive);
    windowTarget?.addEventListener?.("blur", cancelActive);
    if (target.style) target.style.touchAction = "none";
    detach = () => {
      target?.removeEventListener?.("pointerdown", onPointerDown);
      target?.removeEventListener?.("pointermove", onPointerMove);
      target?.removeEventListener?.("pointerup", onPointerUp);
      target?.removeEventListener?.("pointercancel", cancelActive);
      target?.removeEventListener?.("lostpointercapture", cancelActive);
      windowTarget?.removeEventListener?.("blur", cancelActive);
      if (session.status === "dragging") releasePointer();
      if (target?.style) target.style.touchAction = "";
      target = null;
      windowTarget = null;
      detach = null;
    };
    return detach;
  }

  return {
    session,
    attach,
    detach: () => detach?.(),
    cancel: () => cancelActive(),
    commit: () => {
      const result = commitRoadSegment(session);
      if (result) emit("onCommit", result);
      return result;
    },
  };
}

function selectionGeometry(session) {
  if (!session.anchor) return { rectangle: null, cells: [] };
  if (session.mode === "corridor") {
    const points = session.points.length ? session.points : [session.anchor, session.cursor || session.anchor];
    return { rectangle: null, cells: corridorCells(points, session.width) };
  }
  const base = normalizeRectangle(session.anchor, session.cursor || session.anchor);
  const rectangle = rotateRectangle(base, session.orientation);
  return { rectangle, cells: rectangleCells(rectangle) };
}

export function validateSelection(selection, options = {}) {
  const limits = normalizeLimits(options.limits);
  const geometry = selection?.geometry || selectionGeometry(selection || {});
  const rectangle = geometry.rectangle;
  const cells = geometry.cells || [];
  const issues = [];

  if (!cells.length) issues.push({ code: "empty", message: "Select at least one map tile." });
  if (rectangle) {
    const metrics = rectangleMetrics(rectangle);
    if (rectangle.w < limits.minWidth || rectangle.h < limits.minHeight) {
      issues.push({ code: "below-minimum", message: "The selected footprint is smaller than this design allows." });
    }
    if (metrics.shortSide > limits.maxShortSide) {
      issues.push({ code: "short-side", message: `This design may be only ${limits.maxShortSide} tiles across at this qualification.` });
    }
    if (metrics.longSide > limits.maxLongSide) {
      issues.push({ code: "long-side", message: `This design may be only ${limits.maxLongSide} tiles long at this qualification.` });
    }
    if (metrics.area > limits.maxArea) {
      issues.push({ code: "area", message: `This design may cover only ${limits.maxArea} tiles at this qualification.` });
    }
  }

  if (typeof options.validateCell === "function") {
    cells.forEach((cell) => {
      const result = options.validateCell(cell, selection);
      if (result === true || result == null) return;
      const message = typeof result === "string" ? result : result.message;
      issues.push({
        code: typeof result === "object" && result.code ? result.code : "blocked-cell",
        cell,
        message: message || `Tile ${cell.x},${cell.y} cannot be selected.`,
      });
    });
  }

  if (typeof options.validateSelection === "function") {
    const result = options.validateSelection({ ...selection, rectangle, cells });
    if (result !== true && result != null) {
      const values = Array.isArray(result) ? result : [result];
      values.forEach((value) => {
        const message = typeof value === "string" ? value : value.message;
        issues.push({
          code: typeof value === "object" && value.code ? value.code : "blocked-selection",
          message: message || "This selection is not available.",
        });
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    firstIssue: issues[0] || null,
    rectangle,
    cells,
    metrics: rectangle ? rectangleMetrics(rectangle) : { area: cells.length, perimeter: 0, shortSide: 0, longSide: 0 },
  };
}

export function createSelectionSession(options = {}) {
  const mode = options.mode === "corridor" ? "corridor" : "area";
  const session = {
    mode,
    width: Math.max(1, integer(options.width, mode === "corridor" ? 2 : 1)),
    limits: normalizeLimits(options.limits),
    status: "idle",
    pointerId: null,
    anchor: null,
    cursor: null,
    points: [],
    orientation: 0,
    geometry: { rectangle: null, cells: [] },
    validation: validateSelection({ mode, anchor: null, cursor: null, points: [], width: options.width }, { limits: options.limits }),
  };
  return session;
}

export function updateSelection(session, cursor, options = {}) {
  if (!session || !session.anchor) return session;
  session.cursor = point(cursor);
  if (session.mode === "corridor" && options.appendPoint) {
    const next = point(cursor);
    const previous = session.points[session.points.length - 1];
    if (!previous || previous.x !== next.x || previous.y !== next.y) session.points.push(next);
  }
  session.geometry = selectionGeometry(session);
  session.validation = validateSelection(session, { limits: session.limits, ...options });
  return session;
}

export function beginSelection(session, anchor, pointerId = null) {
  if (!session) return null;
  session.status = "dragging";
  session.pointerId = pointerId;
  session.anchor = point(anchor);
  session.cursor = point(anchor);
  session.points = [point(anchor)];
  session.orientation = 0;
  session.geometry = selectionGeometry(session);
  session.validation = validateSelection(session, { limits: session.limits });
  return session;
}

export function rotateSelection(session) {
  if (!session || session.mode !== "area" || !session.anchor) return session;
  session.orientation = session.orientation === 0 ? 90 : 0;
  session.geometry = selectionGeometry(session);
  session.validation = validateSelection(session, { limits: session.limits });
  return session;
}

export function cancelSelection(session) {
  if (!session) return null;
  session.status = "idle";
  session.pointerId = null;
  session.anchor = null;
  session.cursor = null;
  session.points = [];
  session.orientation = 0;
  session.geometry = { rectangle: null, cells: [] };
  session.validation = validateSelection(session, { limits: session.limits });
  return session;
}

export function commitSelection(session) {
  if (!session || session.status !== "dragging") return null;
  session.status = session.validation.valid ? "committed" : "blocked";
  return session.validation.valid ? {
    mode: session.mode,
    rectangle: session.geometry.rectangle,
    cells: session.geometry.cells.map(point),
    orientation: session.orientation,
    metrics: session.validation.metrics,
  } : null;
}

export function createPointerController(options = {}) {
  const session = options.session || createSelectionSession(options);
  let target = null;
  let detach = null;

  function toGrid(event) {
    return typeof options.toGrid === "function" ? options.toGrid(event) : { x: event.tileX, y: event.tileY };
  }

  function emit(name, value) {
    const callback = options[name];
    if (typeof callback === "function") callback(value, session);
  }

  function onPointerDown(event) {
    if (event.button != null && event.button !== 0) return;
    if (event.preventDefault) event.preventDefault();
    const next = beginSelection(session, toGrid(event), event.pointerId ?? null);
    if (event.currentTarget?.setPointerCapture && event.pointerId != null) event.currentTarget.setPointerCapture(event.pointerId);
    emit("onStart", next);
  }

  function onPointerMove(event) {
    if (session.status !== "dragging") return;
    if (session.pointerId != null && event.pointerId != null && session.pointerId !== event.pointerId) return;
    if (event.preventDefault) event.preventDefault();
    const next = updateSelection(session, toGrid(event), {
      limits: session.limits,
      appendPoint: session.mode === "corridor",
      validateCell: options.validateCell,
      validateSelection: options.validateSelection,
    });
    emit("onPreview", next);
  }

  function onPointerUp(event) {
    if (session.status !== "dragging") return;
    if (session.pointerId != null && event.pointerId != null && session.pointerId !== event.pointerId) return;
    if (event.preventDefault) event.preventDefault();
    const result = commitSelection(session);
    if (event.currentTarget?.releasePointerCapture && event.pointerId != null) event.currentTarget.releasePointerCapture(event.pointerId);
    emit(result ? "onCommit" : "onBlocked", result || session.validation);
    session.pointerId = null;
  }

  function onCancel(event) {
    if (session.status !== "dragging") return;
    if (event?.preventDefault) event.preventDefault();
    if (event?.currentTarget?.releasePointerCapture && event.pointerId != null) event.currentTarget.releasePointerCapture(event.pointerId);
    cancelSelection(session);
    emit("onCancel", session);
  }

  function attach(nextTarget) {
    if (detach) detach();
    target = nextTarget;
    if (!target?.addEventListener) return () => {};
    target.addEventListener("pointerdown", onPointerDown);
    target.addEventListener("pointermove", onPointerMove);
    target.addEventListener("pointerup", onPointerUp);
    target.addEventListener("pointercancel", onCancel);
    target.addEventListener("lostpointercapture", onCancel);
    if (target.style) target.style.touchAction = "none";
    detach = () => {
      target.removeEventListener?.("pointerdown", onPointerDown);
      target.removeEventListener?.("pointermove", onPointerMove);
      target.removeEventListener?.("pointerup", onPointerUp);
      target.removeEventListener?.("pointercancel", onCancel);
      target.removeEventListener?.("lostpointercapture", onCancel);
      if (target.style) target.style.touchAction = "";
      target = null;
      detach = null;
    };
    return detach;
  }

  return {
    session,
    attach,
    detach: () => detach?.(),
    begin: (anchor, pointerId = null) => beginSelection(session, anchor, pointerId),
    update: (cursor, updateOptions = {}) => updateSelection(session, cursor, { limits: session.limits, ...updateOptions }),
    rotate: () => rotateSelection(session),
    cancel: () => { cancelSelection(session); emit("onCancel", session); },
    commit: () => commitSelection(session),
  };
}

const api = {
  normalizeRectangle,
  rectangleCells,
  rectangleMetrics,
  rotateRectangle,
  corridorCenterline,
  corridorCells,
  orthogonalSegmentPoints,
  createRoadSegmentSession,
  beginRoadSegment,
  updateRoadSegment,
  cancelRoadSegment,
  commitRoadSegment,
  createRoadSegmentController,
  validateSelection,
  createSelectionSession,
  updateSelection,
  beginSelection,
  rotateSelection,
  cancelSelection,
  commitSelection,
  createPointerController,
};

if (typeof globalThis !== "undefined" && globalThis.window) globalThis.window.PinebarrowPlacement = api;
