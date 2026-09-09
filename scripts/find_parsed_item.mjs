import fs from "node:fs";
import vm from "node:vm";

const rawPath = process.argv[2];
const term = process.argv[3] || "";
if (!rawPath || !term) {
  throw new Error("Usage: find_parsed_item.mjs raw-workbook.json search-term");
}

const context = { window: {}, console };
context.globalThis = context;
vm.createContext(context);

for (const file of ["normalizer.js", "menu-parser.js"]) {
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
}

const normalizeText = context.window.NutriMenuCore.normalizeText;
const rawWorkbook = JSON.parse(fs.readFileSync(rawPath, "utf8"));
const imported = context.window.NutriMenuParser.parseWorkbookData(rawWorkbook);
const search = normalizeText(term);
const matches = [];

function hasTerm(value) {
  return normalizeText(value).includes(search);
}

for (const day of imported.days) {
  for (const [mealKey, menus] of Object.entries(day.meals || {})) {
    for (const menu of menus) {
      for (const group of menu.groups || []) {
        for (const section of group.commonSections || []) {
          for (const item of section.items || []) {
            if (hasTerm(item)) {
              matches.push({
                date: day.dateText,
                mealKey,
                menu: menu.title,
                group: group.title,
                area: section.title,
                item
              });
            }
          }
        }
        for (const suggestion of group.suggestions || []) {
          for (const dish of suggestion.dishes || []) {
            if (hasTerm(dish.name)) {
              matches.push({
                date: day.dateText,
                mealKey,
                menu: menu.title,
                group: group.title,
                area: suggestion.title,
                item: dish.name
              });
            }
          }
        }
      }
    }
  }
}

console.log(JSON.stringify(matches.slice(0, 80), null, 2));
