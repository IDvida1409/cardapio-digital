import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);

async function loadScripts(names, windowOverrides = {}) {
  const context = vm.createContext({
    window: { ...windowOverrides },
    console,
    Date,
    FormData: class FormData {
      append() {}
    },
    setTimeout,
    clearTimeout
  });

  for (const name of names) {
    const code = await readFile(new URL(name, root), "utf8");
    vm.runInContext(code, context, { filename: name });
  }
  return context.window;
}

function cell(address, rowNumber, colNumber, text, endCol = colNumber) {
  return {
    key: `${colNumber}:${endCol}:${text}`,
    address,
    rowNumber,
    colNumber,
    startCol: colNumber,
    endCol,
    text
  };
}

function row(number, cells) {
  return {
    number,
    cells,
    text: cells.map((item) => item.text).join(" | ")
  };
}

test("parser recognizes side-by-side headers split across rows", async () => {
  const window = await loadScripts(["normalizer.js", "menu-parser.js"]);
  const imported = window.NutriMenuParser.parseWorkbookData({
    fileName: "estrutura-generica.xlsx",
    importedAt: "2026-09-22T00:00:00.000Z",
    sheetCount: 1,
    sheets: [{
      id: 1,
      name: "Semana 1",
      rowCount: 6,
      columnCount: 6,
      rows: [
        row(1, [cell("A1", 1, 1, "Cardápio 1", 3), cell("D1", 1, 4, "Cardápio 2", 6)]),
        row(2, [cell("A2", 2, 1, "Almoço 01/09/2026", 3), cell("D2", 2, 4, "Jantar 02/09/2026", 6)]),
        row(4, [cell("A4", 4, 1, "Geral", 3), cell("D4", 4, 4, "Geral", 6)]),
        row(5, [cell("A5", 5, 1, "Arroz; feijão; frango", 3), cell("D5", 5, 4, "Sopa de legumes", 6)])
      ]
    }]
  });

  assert.equal(imported.cardapios.length, 2);
  assert.equal(imported.days.length, 2);
  assert.equal(Array.from(imported.cardapios, (menu) => menu.mealKey).join(","), "almoco,jantar");
  assert.ok(imported.cardapios.every((menu) => menu.itemCount > 0));
});

test("parser accepts explicit meal and date without a Cardápio label", async () => {
  const window = await loadScripts(["normalizer.js", "menu-parser.js"]);
  const imported = window.NutriMenuParser.parseWorkbookData({
    fileName: "layout-livre.xlsx",
    importedAt: "2026-09-22T00:00:00.000Z",
    sheetCount: 1,
    sheets: [{
      id: 1,
      name: "Setembro",
      rowCount: 3,
      columnCount: 2,
      rows: [
        row(1, [cell("A1", 1, 1, "Café da manhã 03/09/2026", 2)]),
        row(2, [cell("A2", 2, 1, "Geral", 2)]),
        row(3, [cell("A3", 3, 1, "Pão; leite; mamão", 2)])
      ]
    }]
  });

  assert.equal(imported.days.length, 1);
  assert.equal(imported.cardapios[0].mealKey, "cafe");
  assert.ok(imported.cardapios[0].itemCount >= 3);
});

test("importer uses a valid local parse without calling the backend", async () => {
  const validImport = {
    days: [{ key: "dia-1" }],
    cardapios: [{ itemCount: 2 }],
    warnings: [],
    menuSheets: ["Semana"],
    ignoredSheets: []
  };
  let backendCalls = 0;
  const window = await loadScripts(["menu-importer.js"], {
    NutriMenuCore: {
      normalizeText: (value) => String(value || "").toLowerCase(),
      titleCase: (value) => String(value || "")
    },
    NutriMenuExcelReader: { readWorkbook: async () => ({}) },
    NutriMenuParser: { parseWorkbookData: () => validImport },
    NutriMenuValidator: {
      validateImportedMenu: () => ({ status: "ok", warnings: [], errors: [] })
    },
    fetch: async () => {
      backendCalls += 1;
      throw new Error("backend should not be called");
    }
  });

  const imported = await window.NutriMenuImporter.parseWorkbook({ name: "teste.xlsx" });
  assert.equal(imported.source, "local-structural");
  assert.equal(imported.serverImport, false);
  assert.equal(backendCalls, 0);
  assert.match(imported.warnings[0], /sem depender de IA/i);
});
