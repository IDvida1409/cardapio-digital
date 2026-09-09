import fs from "node:fs";
import vm from "node:vm";

const rawPath = process.argv[2];
if (!rawPath) {
  throw new Error("Usage: inspect_import.mjs raw-workbook.json");
}

const context = {
  window: {},
  console
};
context.globalThis = context;
vm.createContext(context);

for (const file of ["normalizer.js", "menu-parser.js"]) {
  const source = fs.readFileSync(file, "utf8");
  vm.runInContext(source, context, { filename: file });
}

const rawWorkbook = JSON.parse(fs.readFileSync(rawPath, "utf8"));
const imported = context.window.NutriMenuParser.parseWorkbookData(rawWorkbook);
const dateFilter = process.argv[3] || "24/08";
const mealFilter = process.argv[4] || "almoco";
const groupFilter = new RegExp(process.argv[5] || "fase 1|fase 2|infantil|hipossodica|cremosa", "i");
const day = imported.days.find((item) => item.dateText === dateFilter);
const almoco = day?.meals?.[mealFilter]?.[0];

if (!almoco) {
  console.log(JSON.stringify({
    error: `${mealFilter} ${dateFilter} não encontrado`,
    availableDays: imported.days.map((item) => item.dateText)
  }, null, 2));
  process.exit(1);
}

const importantGroups = almoco.groups
  .filter((group) => groupFilter.test(group.title))
  .map((group) => ({
    title: group.title,
    itemCount: group.itemCount,
    commonSections: group.commonSections,
    suggestions: group.suggestions.map((suggestion) => ({
      title: suggestion.title,
      itemCount: suggestion.itemCount,
      dishes: suggestion.dishes.map((dish) => dish.name)
    }))
  }));

console.log(JSON.stringify({
  day: day.title,
  meal: almoco.title,
  itemCount: almoco.itemCount,
  groupCount: almoco.groups.length,
  groups: importantGroups
}, null, 2));
