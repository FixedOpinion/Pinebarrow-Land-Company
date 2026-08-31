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
      const TOWN_BLOCK_COLUMNS = [
        { x: 1, w: 12 }, { x: 17, w: 11 }, { x: 32, w: 11 },
        { x: 47, w: 11 }, { x: 62, w: 11 }, { x: 77, w: 12 }
      ];
      const TOWN_BLOCK_ROWS = [{ y: 126, h: 15 }, { y: 147, h: 19 }];`;

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
        { id: "townhall", label: "Town Hall", x: 34, y: 129, w: 7, h: 10, doorX: 37, doorY: 141 },
        { id: "market", label: "Market", x: 3, y: 131, w: 7, h: 7, doorX: 6, doorY: 141 },
        { id: "garage", label: "Garage", x: 64, y: 131, w: 7, h: 7, doorX: 67, doorY: 141 },
        { id: "newsstand", label: "News", x: 20, y: 151, w: 4, h: 4, doorX: 22, doorY: 146 },
        { id: "rental", label: "Rental Shop", x: 49, y: 151, w: 6, h: 6, doorX: 52, doorY: 146 }
      ];

      const businessLots = [
        { id: "foundry", label: "Pinebarrow Foundry", material: "coal", x: 3, y: 151, w: 7, h: 8, doorX: 6, doorY: 146, sign: "FOUNDRY" },
        { id: "railworks", label: "Rail Works", material: "iron", x: 19, y: 131, w: 6, h: 7, doorX: 22, doorY: 141, sign: "RAIL" },
        { id: "glassworks", label: "Glassworks", material: "quartz", x: 49, y: 131, w: 6, h: 7, doorX: 52, doorY: 141, sign: "GLASS" },
        { id: "cannery", label: "Main Street Cannery", material: "tin", x: 79, y: 151, w: 7, h: 8, doorX: 82, doorY: 146, sign: "CANNERY" }
      ];`;

function replaceExactlyOnce(source: string, expected: string, replacement: string, label: string) {
  const first = source.indexOf(expected);
  if (first < 0) throw new Error(`Pinebarrow patch marker missing: ${label}`);
  if (source.indexOf(expected, first + expected.length) >= 0) throw new Error(`Pinebarrow patch marker duplicated: ${label}`);
  return source.replace(expected, replacement);
}

export function applyGameEnginePatches(source: string) {
  let patched = source;
  patched = replaceExactlyOnce(patched, EXPECTED_TOWN_LAYOUT, UPDATED_TOWN_LAYOUT, "town layout");
  patched = replaceExactlyOnce(patched, EXPECTED_BUILDINGS, UPDATED_BUILDINGS, "town building proportions");
  return patched;
}
