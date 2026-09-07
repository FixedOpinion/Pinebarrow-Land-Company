import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import postcss from "postcss";
import ts from "typescript";

// Static integration checks; gameplay/HTML tests cover the runtime separately.
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const hud = postcss.parse(read("../app/pinebarrow-dark-hud.css"));
const theme = postcss.parse(read("../app/pinebarrow-dark-theme.css"));
const globals = postcss.parse(read("../app/globals.css"));
function declarations(root, selector) {
  const result = {};
  root.walkRules((rule) => {
    if (rule.selector === selector && rule.parent.type === "root") {
      rule.walkDecls((declaration) => { result[declaration.prop] = declaration.value; });
    }
  });
  return result;
}

test("HUD keeps menu and newspaper as sibling controls above the shared stats row", () => {
  const source = ts.createSourceFile("page.tsx", read("../app/page.tsx"),
    ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const attribute = (node, name) => node.openingElement.attributes.properties
    .find((attr) => ts.isJsxAttribute(attr) && attr.name.getText(source) === name)?.initializer?.text;
  const elements = [];
  function visit(node) {
    if (ts.isJsxElement(node)) elements.push(node);
    ts.forEachChild(node, visit);
  }
  visit(source);
  const header = elements.find((node) => attribute(node, "id") === "pb7-hud");
  assert.ok(header);
  const children = header.children.filter(ts.isJsxElement);
  assert.equal(attribute(children[0], "className"), "hud-news-wrap");
  assert.equal(attribute(children[1], "className"), "header-stats");
  const controls = children[0].children.filter(ts.isJsxElement);
  assert.deepEqual(controls.map((node) => attribute(node, "id")), ["pb7-menu-toggle", "pb7-daily-news"]);
  for (const id of ["pb7-menu-toggle", "pb7-daily-news", "pb7-cash", "pb7-time", "pb7-truck"]) {
    assert.equal(elements.filter((node) => attribute(node, "id") === id).length, 1);
  }
});

test("HUD uses one 60 percent top container and flow layout, not detached pixel offsets", () => {
  const cluster = declarations(hud, "#pinebarrow-visible-menu-demo #pb7-hud");
  assert.equal(cluster.width, "60%");
  assert.equal(cluster.left, "20%");
  assert.equal(cluster.top, "env(safe-area-inset-top, 0px)");
  assert.equal(cluster.gap, "0");
  assert.equal(cluster["max-width"], "none");
  for (const selector of ["#pb7-hud .hud-news-wrap", "#pb7-hud .header-stats",
    "#pb7-hud #pb7-menu-toggle", "#pb7-hud #pb7-daily-news"]) {
    assert.equal(declarations(hud, selector).position, "static", selector);
  }
  assert.equal(declarations(hud, "#pb7-hud .header-stats").gap, "0");
  assert.equal(declarations(hud, "#pb7-hud #pb7-menu-toggle")["z-index"], "auto");
  assert.equal(declarations(hud, "#pb7-hud #pb7-daily-news")["z-index"], "auto");
  assert.equal(declarations(hud, "#pb7-hud #pb7-system-menu").top, "100%");
  assert.doesNotMatch(read("../app/layout.tsx"), /pinebarrow-ui-overrides/);
  assert.doesNotMatch(read("../app/globals.css"), /HUD checkpoint: newspaper first/);
});

test("HUD stays compact without changing its centered 60 percent geometry", () => {
  assert.equal(declarations(hud, "#pb7-hud .hud-news-wrap")["grid-template-columns"], "34px minmax(0, 1fr)");
  assert.equal(declarations(hud, "#pb7-hud #pb7-menu-toggle")["min-height"], "36px");
  assert.equal(declarations(hud, "#pb7-hud .news-masthead")["min-height"], "18px");
  assert.equal(declarations(hud, "#pb7-hud .news-story-row")["min-height"], "20px");
  assert.equal(declarations(hud, "#pb7-hud .stat-pill")["min-height"], "32px");
  assert.equal(declarations(hud, "#pb7-hud .stat-copy small")["font-size"], "0.75rem");
  assert.equal(declarations(hud, "#pb7-hud .stat-copy strong")["font-size"], "0.75rem");
});

test("dark theme covers every menu surface and both enabled and disabled controls", () => {
  const surfaceRules = [];
  theme.walkRules((rule) => {
    if (rule.nodes.some((node) => node.type === "decl" && node.prop === "background")) {
      surfaceRules.push(rule.selector);
    }
  });
  const selectors = surfaceRules.join(" ");
  for (const surface of ["start-card", "system-menu-popover", "building-panel",
    "operations-terminal", "market-terminal", "expanded-newspaper", "fast-travel-menu",
    "profile-slot", "townhall-project-actions", "townhall-prospect-card",
    "management-card", "contract-offer-card", "exchange-order-form", "stock-ad"]) {
    assert.ok(selectors.includes("." + surface), surface);
  }
  assert.equal(declarations(theme, "#pinebarrow-visible-menu-demo button").background, "var(--secondary)");
  assert.equal(declarations(globals, "button:disabled").background, "#211d17");
  assert.equal(declarations(globals, ":root")["color-scheme"], "dark");
  // Important light colors would bypass all normal theme-specific selectors.
  globals.walkDecls((decl) => {
    if (decl.important && /^(color|background|box-shadow)$/.test(decl.prop)) {
      assert.ok(["#b1a28b", "#211d17", "none"].includes(decl.value), decl.toString());
    }
  });
});

test("fullscreen touch sizing remains isolated from normal map controls", () => {
  const selector = '#pinebarrow-visible-menu-demo:is(:fullscreen, [data-fullscreen="true"]) .touch-dpad';
  assert.equal(declarations(hud, selector).width, "138px");
  assert.equal(declarations(hud, selector)["grid-template-columns"], "repeat(3, 46px)");
});
