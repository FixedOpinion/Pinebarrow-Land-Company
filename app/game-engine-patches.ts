const EXPECTED_TOWN_LAYOUT = `      const MAIN_STREET_TOP = 142;
      const MAIN_STREET_BOTTOM = 146;
      const TOWN_SIDE_STREET_WIDTH = 2;
      const TOWN_SIDE_STREET_XS = [14, 29, 44, 59, 74];
      const TOWN_BLOCK_COLUMNS = [
        { x: 1, w: 12 }, { x: 17, w: 11 }, { x: 32, w: 11 },
        { x: 47, w: 11 }, { x: 62, w: 11 }, { x: 77, w: 12 }
      ];
      const TOWN_BLOCK_ROWS = [{ y: 126, h: 15 }, { y: 147, h: 19 }];`;

const UPDATED_TOWN_LAYOUT = `      const MAIN_STREET_TOP = 142;
      const MAIN_STREET_BOTTOM = 146;
      const TOWN_SIDE_STREET_WIDTH = 2;
      const TOWN_SIDE_STREET_XS = [14, 29, 44, 59, 74];
      const NORTH_AVENUE_TOP = 127;
      const NORTH_AVENUE_BOTTOM = 129;
      const SOUTH_AVENUE_TOP = 163;
      const SOUTH_AVENUE_BOTTOM = 165;
      const TOWN_BLOCK_COLUMNS = [
        { x: 1, w: 12 }, { x: 17, w: 11 }, { x: 32, w: 11 },
        { x: 47, w: 11 }, { x: 62, w: 11 }, { x: 77, w: 12 }
      ];
      const TOWN_BLOCK_ROWS = [{ y: 130, h: 11 }, { y: 147, h: 15 }];`;

const EXPECTED_BUILDINGS = `      const buildings = [
        { id: "townhall", label: "Town Hall", x: 34, y: 130, w: 9, h: 9, doorX: 38, doorY: 141 },
        { id: "market", label: "Market", x: 3, y: 130, w: 9, h: 9, doorX: 7, doorY: 141 },
        { id: "garage", label: "Garage", x: 63, y: 130, w: 9, h: 9, doorX: 67, doorY: 141 },
        { id: "newsstand", label: "News", x: 19, y: 150, w: 5, h: 5, doorX: 21, doorY: 146 },
        { id: "rental", label: "Rental Shop", x: 49, y: 150, w: 8, h: 7, doorX: 53, doorY: 146 }
      ];

      const businessLots = [
        { id: "foundry", label: "Pinebarrow Foundry", material: "coal", x: 3, y: 150, w: 9, h: 9, doorX: 7, doorY: 146, sign: "FOUNDRY" },
        { id: "railworks", label: "Rail Works", material: "iron", x: 19, y: 130, w: 8, h: 9, doorX: 23, doorY: 141, sign: "RAIL" },
        { id: "glassworks", label: "Glassworks", material: "quartz", x: 49, y: 130, w: 8, h: 9, doorX: 53, doorY: 141, sign: "GLASS" },
        { id: "cannery", label: "Main Street Cannery", material: "tin", x: 78, y: 150, w: 9, h: 9, doorX: 82, doorY: 146, sign: "CANNERY" }
      ];`;

const UPDATED_BUILDINGS = `      const buildings = [
        { id: "townhall", label: "Town Hall", x: 34, y: 131, w: 7, h: 8, doorX: 37, doorY: 141 },
        { id: "market", label: "Market", x: 3, y: 132, w: 7, h: 6, doorX: 6, doorY: 141 },
        { id: "garage", label: "Garage", x: 64, y: 132, w: 7, h: 6, doorX: 67, doorY: 141 },
        { id: "newsstand", label: "News", x: 20, y: 149, w: 4, h: 4, doorX: 22, doorY: 146 },
        { id: "rental", label: "Rental Shop", x: 49, y: 149, w: 6, h: 6, doorX: 52, doorY: 146 }
      ];

      const businessLots = [
        { id: "foundry", label: "Pinebarrow Foundry", material: "coal", x: 3, y: 149, w: 7, h: 9, doorX: 6, doorY: 146, sign: "FOUNDRY" },
        { id: "railworks", label: "Rail Works", material: "iron", x: 19, y: 132, w: 6, h: 6, doorX: 22, doorY: 141, sign: "RAIL" },
        { id: "glassworks", label: "Glassworks", material: "quartz", x: 49, y: 132, w: 6, h: 6, doorX: 52, doorY: 141, sign: "GLASS" },
        { id: "cannery", label: "Main Street Cannery", material: "tin", x: 79, y: 149, w: 7, h: 9, doorX: 82, doorY: 146, sign: "CANNERY" }
      ];`;

function replaceExactlyOnce(source: string, expected: string, replacement: string, label: string) {
  const first = source.indexOf(expected);
  if (first < 0) throw new Error(`Pinebarrow patch marker missing: ${label}`);
  if (source.indexOf(expected, first + expected.length) >= 0) throw new Error(`Pinebarrow patch marker duplicated: ${label}`);
  return source.replace(expected, replacement);
}

function replaceFunctionRange(source: string, startMarker: string, endMarker: string, replacement: string, label: string) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) throw new Error(`Pinebarrow patch range missing: ${label}`);
  return source.slice(0, start) + replacement + "\n\n      " + source.slice(end);
}

const UPDATED_TOWN_SURFACE = `function isTownSideStreet(x, y) {
        if (!insideTown(x, y)) return false;
        const vertical = TOWN_SIDE_STREET_XS.some(function (streetX) {
          return x >= streetX && x < streetX + TOWN_SIDE_STREET_WIDTH && y >= NORTH_AVENUE_TOP && y < SOUTH_AVENUE_BOTTOM;
        });
        const northAvenue = y >= NORTH_AVENUE_TOP && y < NORTH_AVENUE_BOTTOM;
        const southAvenue = y >= SOUTH_AVENUE_TOP && y < SOUTH_AVENUE_BOTTOM;
        return vertical || northAvenue || southAvenue;
      }`;

const UPDATED_BLOCK_DRAW = `function drawTownBlocksAndLots() {
        ctx.save();

        TOWN_BLOCKS.forEach(function (block) {
          const point = screenPoint(block.x, block.y);
          const width = block.w * drawView.scale;
          const height = block.h * drawView.scale;
          const inset = Math.max(1, drawView.scale * .16);

          ctx.fillStyle = "rgba(226,222,204,.28)";
          ctx.fillRect(point.x + inset, point.y + inset, Math.max(1, width - inset * 2), Math.max(1, height - inset * 2));

          ctx.strokeStyle = "rgba(94,101,96,.48)";
          ctx.lineWidth = Math.max(1, drawView.scale * .08);
          ctx.setLineDash([]);
          ctx.strokeRect(point.x + inset, point.y + inset, Math.max(1, width - inset * 2), Math.max(1, height - inset * 2));
        });

        buildings.concat(businessLots).forEach(function (building) {
          const margin = building.id === "townhall" ? .85 : .55;
          const point = screenPoint(building.x - margin, building.y - margin);
          const width = (building.w + margin * 2) * drawView.scale;
          const height = (building.h + margin * 2) * drawView.scale;

          ctx.fillStyle = building.id === "townhall" ? "rgba(240,232,207,.76)" : "rgba(203,205,194,.68)";
          ctx.fillRect(point.x, point.y, width, height);

          ctx.strokeStyle = "rgba(76,84,82,.5)";
          ctx.lineWidth = Math.max(1, drawView.scale * .055);
          ctx.strokeRect(point.x, point.y, width, height);

          if (drawView.scale >= 4 && building.id !== "townhall") {
            const parkingDepth = Math.min(drawView.scale * .85, height * .24);
            const parkingY = point.y + height - parkingDepth;
            ctx.fillStyle = "rgba(118,123,121,.38)";
            ctx.fillRect(point.x + drawView.scale * .2, parkingY, Math.max(1, width - drawView.scale * .4), parkingDepth);
            ctx.strokeStyle = "rgba(255,255,255,.68)";
            ctx.lineWidth = Math.max(.7, drawView.scale * .04);
            const spaces = Math.max(2, Math.min(5, Math.floor(building.w / 1.7)));
            for (let space = 1; space < spaces; space += 1) {
              const parkingX = point.x + width * space / spaces;
              ctx.beginPath();
              ctx.moveTo(parkingX, parkingY + drawView.scale * .08);
              ctx.lineTo(parkingX, parkingY + parkingDepth - drawView.scale * .08);
              ctx.stroke();
            }
          }
        });
        ctx.restore();
      }`;

const UPDATED_STREET_DRAW = `function drawTownStreetDetails(colors) {
        const scale = drawView.scale;
        const mainLeft = screenPoint(TOWN_LEFT, MAIN_STREET_TOP);
        const mainRight = screenPoint(TOWN_RIGHT, MAIN_STREET_TOP);
        const centerY = screenPoint(TOWN_LEFT, MAIN_STREET_TOP + 2).y;
        ctx.save();
        ctx.lineCap = "butt";

        ctx.strokeStyle = colors.curb;
        ctx.globalAlpha = .95;
        ctx.lineWidth = Math.max(1, scale * .11);
        [MAIN_STREET_TOP, MAIN_STREET_BOTTOM].forEach(function (roadY) {
          const edge = screenPoint(TOWN_LEFT, roadY);
          ctx.beginPath();
          ctx.moveTo(edge.x, edge.y);
          ctx.lineTo(mainRight.x, edge.y);
          ctx.stroke();
        });

        ctx.strokeStyle = colors.roadLine;
        ctx.lineWidth = Math.max(1.2, scale * .09);
        ctx.setLineDash([]);
        [-.09, .09].forEach(function (offset) {
          ctx.beginPath();
          ctx.moveTo(mainLeft.x, centerY + scale * offset);
          ctx.lineTo(mainRight.x, centerY + scale * offset);
          ctx.stroke();
        });

        ctx.strokeStyle = colors.roadWhite;
        ctx.globalAlpha = .78;
        ctx.lineWidth = Math.max(1, scale * .065);
        ctx.setLineDash([Math.max(3, scale * .52), Math.max(3, scale * .48)]);
        [MAIN_STREET_TOP + 1, MAIN_STREET_TOP + 3].forEach(function (laneY) {
          const lane = screenPoint(TOWN_LEFT, laneY);
          ctx.beginPath();
          ctx.moveTo(lane.x, lane.y);
          ctx.lineTo(mainRight.x, lane.y);
          ctx.stroke();
        });

        [NORTH_AVENUE_TOP, SOUTH_AVENUE_TOP].forEach(function (avenueTop) {
          const avenueBottom = avenueTop + 2;
          const top = screenPoint(TOWN_LEFT, avenueTop);
          const bottom = screenPoint(TOWN_LEFT, avenueBottom);
          const center = screenPoint(TOWN_LEFT, avenueTop + 1);
          ctx.strokeStyle = colors.curb;
          ctx.globalAlpha = .9;
          ctx.lineWidth = Math.max(1, scale * .08);
          ctx.setLineDash([]);
          [top.y, bottom.y].forEach(function (roadY) {
            ctx.beginPath();
            ctx.moveTo(top.x, roadY);
            ctx.lineTo(mainRight.x, roadY);
            ctx.stroke();
          });
          ctx.strokeStyle = colors.roadLine;
          ctx.globalAlpha = .7;
          ctx.lineWidth = Math.max(1, scale * .055);
          ctx.setLineDash([Math.max(2, scale * .4), Math.max(3, scale * .42)]);
          ctx.beginPath();
          ctx.moveTo(center.x, center.y);
          ctx.lineTo(mainRight.x, center.y);
          ctx.stroke();
        });

        TOWN_SIDE_STREET_XS.forEach(function (streetX) {
          const centerX = screenPoint(streetX + TOWN_SIDE_STREET_WIDTH / 2, TOWN_TOP).x;
          const northTop = screenPoint(streetX, NORTH_AVENUE_TOP).y;
          const southBottom = screenPoint(streetX, SOUTH_AVENUE_BOTTOM).y;
          const mainTop = screenPoint(streetX, MAIN_STREET_TOP).y;
          const mainBottom = screenPoint(streetX, MAIN_STREET_BOTTOM).y;

          ctx.strokeStyle = colors.curb;
          ctx.globalAlpha = .9;
          ctx.lineWidth = Math.max(1, scale * .08);
          ctx.setLineDash([]);
          [streetX, streetX + TOWN_SIDE_STREET_WIDTH].forEach(function (edgeX) {
            const edge = screenPoint(edgeX, NORTH_AVENUE_TOP);
            ctx.beginPath();
            ctx.moveTo(edge.x, northTop);
            ctx.lineTo(edge.x, southBottom);
            ctx.stroke();
          });

          ctx.strokeStyle = colors.roadLine;
          ctx.globalAlpha = .7;
          ctx.lineWidth = Math.max(1, scale * .055);
          ctx.setLineDash([Math.max(2, scale * .38), Math.max(3, scale * .42)]);
          [[northTop, mainTop], [mainBottom, southBottom]].forEach(function (segment) {
            ctx.beginPath();
            ctx.moveTo(centerX, segment[0]);
            ctx.lineTo(centerX, segment[1]);
            ctx.stroke();
          });
        });

        if (scale >= 6) {
          ctx.globalAlpha = .62;
          ctx.fillStyle = colors.roadWhite;
          ctx.font = "900 " + Math.max(7, Math.min(11, scale * .58)) + "px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          [7, 84].forEach(function (roadX) {
            const label = screenPoint(roadX, MAIN_STREET_TOP + 2);
            ctx.fillText("MAIN ST", label.x, label.y);
          });
        }
        ctx.restore();
      }`;

const UPDATED_BUILDING_RENDERER = `function drawBuilding(building, colors) {
        const point = screenPoint(building.x, building.y);
        const width = building.w * drawView.scale;
        const height = building.h * drawView.scale;
        const s = drawView.scale;
        const styleMap = {
          townhall: { wall: "#e6d8b6", roof: "#385170", trim: "#f2d36b", glass: "#cce1e8", sign: "TOWN HALL" },
          market: { wall: "#d89558", roof: "#9d4050", trim: "#f5db8d", glass: "#d9edf1", sign: "MARKET" },
          garage: { wall: "#84939b", roof: "#344752", trim: "#d97932", glass: "#a8c4cf", sign: "GARAGE" },
          rental: { wall: "#68a798", roof: "#326c64", trim: "#e7cf69", glass: "#c9e7df", sign: "RENTAL" },
          newsstand: { wall: "#e8d4ab", roof: "#843945", trim: "#e2c55f", glass: "#eaf1ef", sign: "DAILY" },
          foundry: { wall: "#8c7a6f", roof: "#4e4542", trim: "#cb7847", glass: "#aeb8b7", sign: "FOUNDRY" },
          railworks: { wall: "#777f87", roof: "#41484e", trim: "#d1a64e", glass: "#aabcc4", sign: "RAIL WORKS" },
          glassworks: { wall: "#86aaa9", roof: "#426968", trim: "#c8e4df", glass: "#cfeff1", sign: "GLASSWORKS" },
          cannery: { wall: "#a47158", roof: "#6a463d", trim: "#d6bd74", glass: "#c9d6d5", sign: "CANNERY" }
        };
        const style = styleMap[building.id] || { wall: colors.building, roof: colors.roof, trim: colors.roadLine, glass: colors.window, sign: building.sign || building.label };

        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,.28)";
        ctx.shadowBlur = Math.max(2, s * .28);
        ctx.shadowOffsetY = Math.max(1, s * .16);
        ctx.fillStyle = style.wall;
        ctx.fillRect(point.x, point.y + height * .16, width, height * .84);
        ctx.shadowColor = "transparent";

        ctx.fillStyle = style.roof;
        ctx.beginPath();
        if (building.id === "townhall") {
          ctx.moveTo(point.x - s * .16, point.y + height * .2);
          ctx.lineTo(point.x + width / 2, point.y - s * .34);
          ctx.lineTo(point.x + width + s * .16, point.y + height * .2);
          ctx.closePath();
        } else if (["foundry", "railworks", "garage"].includes(building.id)) {
          ctx.rect(point.x - s * .08, point.y, width + s * .16, height * .28);
        } else {
          ctx.moveTo(point.x - s * .1, point.y + height * .18);
          ctx.lineTo(point.x + width * .18, point.y - s * .12);
          ctx.lineTo(point.x + width * .82, point.y - s * .12);
          ctx.lineTo(point.x + width + s * .1, point.y + height * .18);
          ctx.closePath();
        }
        ctx.fill();

        if (building.id === "townhall") {
          ctx.fillStyle = style.trim;
          const columnW = Math.max(1.5, s * .13);
          [0.22, 0.42, 0.58, 0.78].forEach(function (share) {
            ctx.fillRect(point.x + width * share - columnW / 2, point.y + height * .42, columnW, height * .43);
          });
          ctx.fillStyle = style.roof;
          ctx.fillRect(point.x + width * .39, point.y - s * .46, width * .22, s * .22);
        } else if (["foundry", "railworks"].includes(building.id)) {
          ctx.fillStyle = "#4a4a46";
          const stackW = Math.max(2, s * .28);
          ctx.fillRect(point.x + width * .72, point.y - s * .62, stackW, s * .72);
        }

        ctx.fillStyle = style.glass;
        const windows = Math.max(2, Math.min(5, Math.floor(building.w / 1.6)));
        const windowY = point.y + height * .42;
        const windowW = Math.max(2, width * .1);
        const windowH = Math.max(2, height * .15);
        for (let i = 0; i < windows; i += 1) {
          const wx = point.x + width * (i + 1) / (windows + 1) - windowW / 2;
          ctx.fillRect(wx, windowY, windowW, windowH);
        }

        const doorW = Math.max(3, width * .14);
        const doorH = Math.max(4, height * .23);
        ctx.fillStyle = style.roof;
        ctx.fillRect(point.x + width / 2 - doorW / 2, point.y + height - doorH, doorW, doorH);

        if (drawView.scale >= 5) {
          const signW = Math.min(width * .82, 92);
          const signH = Math.max(12, Math.min(20, s * .82));
          ctx.fillStyle = "rgba(31,42,43,.9)";
          ctx.fillRect(point.x + (width - signW) / 2, point.y + height * .68, signW, signH);
          ctx.fillStyle = "#f6f1df";
          ctx.font = "900 " + Math.max(7, Math.min(10, s * .48)) + "px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(style.sign, point.x + width / 2, point.y + height * .68 + signH / 2, signW - 6);
        }
        ctx.restore();
      }`;

export function applyGameEnginePatches(source: string) {
  let patched = source;
  patched = replaceExactlyOnce(patched, EXPECTED_TOWN_LAYOUT, UPDATED_TOWN_LAYOUT, "town layout");
  patched = replaceExactlyOnce(patched, EXPECTED_BUILDINGS, UPDATED_BUILDINGS, "town building proportions");
  patched = replaceFunctionRange(patched, "function isTownSideStreet(x, y) {", "function isTownSidewalk(x, y) {", UPDATED_TOWN_SURFACE, "town street surface");
  patched = replaceFunctionRange(patched, "function drawTownBlocksAndLots() {", "function drawVacantBusinessLot(business, colors) {", UPDATED_BLOCK_DRAW, "town block drawing");
  patched = replaceFunctionRange(patched, "function drawTownStreetDetails(colors) {", "function drawRoadAccents(colors) {", UPDATED_STREET_DRAW, "town street drawing");
  const companyMarker = "function drawCompanyStructure(structure, colors, label, kind) {";
  const companyIndex = patched.indexOf(companyMarker);
  if (companyIndex < 0) throw new Error("Pinebarrow patch marker missing: building renderer insertion");
  patched = patched.slice(0, companyIndex) + UPDATED_BUILDING_RENDERER + "\n\n      " + patched.slice(companyIndex);
  return patched;
}
