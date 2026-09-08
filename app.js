const categoryStorageKey = "nutrimenu-categorias-empty-v4";
const legacyCategoryStorageKey = "nutrimenu-categorias";
const baseStorageKey = "nutrimenu-base-mestre-auto-v4";
const legacyBaseStorageKey = "nutrimenu-base-mestre";

const initialCategories = [
  ["Legumes", "Alimentos", ""],
  ["Verduras", "Alimentos", ""],
  ["Grãos", "Alimentos", ""],
  ["Proteínas", "Alimentos", ""],
  ["Frutas", "Alimentos", ""],
  ["Sobremesas", "Alimentos", ""],
  ["Dietas especiais", "Dietas", ""],
  ["Texturas", "Dietas", ""],
  ["Guarnições", "Pratos", ""],
  ["Saladas", "Pratos", ""],
  ["Processos", "Processos", ""],
  ["Molhos", "Processos", ""]
];

const mealDefinitions = [
  { key: "cafe", title: "Café da Manhã", label: "Itens serão carregados pela planilha.", terms: ["cafe da manha", "desjejum"] },
  { key: "almoco", title: "Almoço", label: "Sugestões, dietas e opções aparecerão aqui.", terms: ["almoco"] },
  { key: "jantar", title: "Jantar", label: "Preparações e processos serão vinculados depois.", terms: ["jantar"] }
];

const dayTerms = [
  ["segunda", "Segunda-feira"],
  ["terca", "Terça-feira"],
  ["quarta", "Quarta-feira"],
  ["quinta", "Quinta-feira"],
  ["sexta", "Sexta-feira"],
  ["sabado", "Sábado"],
  ["domingo", "Domingo"]
];

const monthTerms = [
  ["janeiro", "jan", 1],
  ["fevereiro", "fev", 2],
  ["marco", "mar", 3],
  ["abril", "abr", 4],
  ["maio", "mai", 5],
  ["junho", "jun", 6],
  ["julho", "jul", 7],
  ["agosto", "ago", 8],
  ["setembro", "set", 9],
  ["outubro", "out", 10],
  ["novembro", "nov", 11],
  ["dezembro", "dez", 12]
];

const dietTerms = [
  ["geral", "Geral"],
  ["hipossodica", "Hipossódica"],
  ["especial", "Especial"],
  ["pastosa", "Pastosa"],
  ["liquida", "Líquida"],
  ["semi solida", "Semissólida"],
  ["semissolida", "Semissólida"],
  ["branda", "Branda"],
  ["diabetica", "Diabética"],
  ["sem lactose", "Sem lactose"],
  ["sem gluten", "Sem glúten"]
];

const foodDictionary = [
  ["Arroz", "Grãos", ["arroz"]],
  ["Feijão", "Grãos", ["feijao"]],
  ["Lentilha", "Grãos", ["lentilha"]],
  ["Grão-de-bico", "Grãos", ["grao de bico"]],
  ["Aveia", "Grãos", ["aveia"]],
  ["Macarrão", "Grãos", ["macarrao", "massa", "espaguete"]],
  ["Batata", "Legumes", ["batata"]],
  ["Cenoura", "Legumes", ["cenoura"]],
  ["Abobrinha", "Legumes", ["abobrinha"]],
  ["Chuchu", "Legumes", ["chuchu"]],
  ["Beterraba", "Legumes", ["beterraba"]],
  ["Abóbora", "Legumes", ["abobora"]],
  ["Alface", "Verduras", ["alface"]],
  ["Couve", "Verduras", ["couve"]],
  ["Rúcula", "Verduras", ["rucula"]],
  ["Tomate", "Legumes", ["tomate"]],
  ["Frango", "Proteínas", ["frango"]],
  ["Carne bovina", "Proteínas", ["carne bovina", "carne", "patinho", "lagarto"]],
  ["Peixe", "Proteínas", ["peixe", "tilapia", "pescada"]],
  ["Ovo", "Proteínas", ["ovo", "ovos"]],
  ["Leite", "Laticínios", ["leite"]],
  ["Queijo", "Laticínios", ["queijo"]],
  ["Iogurte", "Laticínios", ["iogurte"]],
  ["Banana", "Frutas", ["banana"]],
  ["Maçã", "Frutas", ["maca"]],
  ["Mamão", "Frutas", ["mamao"]],
  ["Melancia", "Frutas", ["melancia"]],
  ["Gelatina", "Sobremesas", ["gelatina"]]
];

const processTerms = [
  "molho",
  "caldo",
  "creme",
  "base",
  "refogado",
  "cozido",
  "assado",
  "grelhado",
  "ensopado",
  "pure",
  "sopa",
  "processado"
];

const controlPatterns = [
  /^cardapio\b/,
  /^sugestao\s*\d*$/,
  /^opcoes?\s+de\s+escolha$/,
  /^dietas?$/,
  /^preparacoes?$/,
  /^preparacao$/,
  /^alimentos?$/,
  /^refeicoes?$/,
  /^observacoes?$/,
  /^geral$/,
  /^especial$/,
  /^almoco$/,
  /^jantar$/,
  /^cafe da manha$/,
  /^segunda( feira)?$/,
  /^terca( feira)?$/,
  /^quarta( feira)?$/,
  /^quinta( feira)?$/,
  /^sexta( feira)?$/,
  /^sabado$/,
  /^domingo$/
];

let categories = loadJson(categoryStorageKey, initialCategories);
let masterBase = loadJson(baseStorageKey, emptyBase());

const categoryGrid = document.getElementById("categoryGrid");
const categoryForm = document.getElementById("categoryForm");
const categoryName = document.getElementById("categoryName");
const categoryGroup = document.getElementById("categoryGroup");
const excelInput = document.getElementById("excelInput");
const clearLocalData = document.getElementById("clearLocalData");
const validationPill = document.querySelector(".validation-pill");
const datePickerLabel = document.getElementById("datePickerLabel");
const summaryLabel = document.getElementById("summaryLabel");
const summaryTitle = document.getElementById("summaryTitle");
const summaryText = document.getElementById("summaryText");
const mealSectionTitle = document.getElementById("mealSectionTitle");
const mealSectionSubtitle = document.getElementById("mealSectionSubtitle");
const masterSummary = document.getElementById("masterSummary");
const importReview = document.getElementById("importReview");
const reviewList = document.getElementById("reviewList");
const dayTabs = document.getElementById("dayTabs");
const mealSelector = document.getElementById("mealSelector");
const masterBaseSection = document.getElementById("base-mestre");
const masterBaseNav = document.getElementById("masterBaseNav");
const closeMasterBase = document.getElementById("closeMasterBase");

let currentImported = null;
let selectedDayKey = "";
let selectedMealKey = "almoco";

function emptyBase() {
  return {
    alimentos: [],
    preparacoes: [],
    processos: [],
    dietas: [],
    cardapios: []
  };
}

function loadJson(key, fallback) {
  const saved = window.localStorage.getItem(key);
  if (!saved) return copyValue(fallback);

  try {
    const parsed = JSON.parse(saved);
    return parsed || copyValue(fallback);
  } catch {
    return copyValue(fallback);
  }
}

function copyValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function saveCategories() {
  window.localStorage.setItem(categoryStorageKey, JSON.stringify(categories));
}

function saveMasterBase() {
  window.localStorage.setItem(baseStorageKey, JSON.stringify(masterBase));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ºª]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[_|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value) {
  const keepLower = new Set(["a", "as", "o", "os", "de", "da", "das", "do", "dos", "e", "ao", "à", "com", "sem"]);
  return String(value || "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word, index) => {
      if (index > 0 && keepLower.has(word)) return word;
      return word.charAt(0).toLocaleUpperCase("pt-BR") + word.slice(1);
    })
    .join(" ");
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function plural(count, singular, pluralText) {
  return `${count} ${count === 1 ? singular : pluralText}`;
}

function cellToText(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toLocaleDateString("pt-BR");
  if (typeof value === "object") {
    if (Array.isArray(value.richText)) return value.richText.map((part) => part.text || "").join("");
    if (value.text) return String(value.text);
    if (value.result !== undefined) return cellToText(value.result);
    if (value.formula) return "";
    return "";
  }
  return String(value);
}

function renderCategoryItems(items, fallbackText) {
  const values = items.length
    ? items.slice(0, 8)
    : String(fallbackText || "").split(",").map((item) => item.trim()).filter(Boolean);
  const hiddenCount = Math.max(0, items.length - values.length);

  if (!values.length) return "";

  return `
    <div class="category-items">
      ${values.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
    </div>
    ${hiddenCount ? `<small>+${hiddenCount} outro(s)</small>` : ""}
  `;
}

function renderCategories() {
  categoryGrid.innerHTML = "";

  const hasImportedRecords = ["alimentos", "preparacoes", "processos", "dietas"].some((collection) => masterBase[collection].length);
  if (!hasImportedRecords) {
    categories.forEach(([name, group, examples]) => {
      const card = document.createElement("article");
      card.className = "category-card";
      card.innerHTML = `
        <strong>${escapeHtml(name)}</strong>
        ${renderCategoryItems([], examples)}
        <em>${escapeHtml(group)}</em>
      `;
      categoryGrid.appendChild(card);
    });
    return;
  }

  const grouped = new Map();

  function addMasterGroup(name, group, items) {
    const key = normalizeText(name);
    const current = grouped.get(key) || { name, group, examples: "", items: [] };
    items.forEach((item) => {
      const text = item && (item.name || item.title || item.key || item);
      if (!text) return;
      const itemKey = normalizeText(text);
      if (!itemKey || current.items.some((currentItem) => normalizeText(currentItem) === itemKey)) return;
      current.items.push(text);
    });
    grouped.set(key, current);
  }

  categories.forEach(([name, group, examples]) => {
    const matchingFoods = (masterBase.alimentos || []).filter((record) => normalizeText(record.category || "") === normalizeText(name));
    if (matchingFoods.length || examples) {
      addMasterGroup(name, group, matchingFoods.length ? matchingFoods : String(examples).split(",").map((item) => item.trim()).filter(Boolean));
    }
  });

  addMasterGroup("Preparações", "Pratos", masterBase.preparacoes || []);
  addMasterGroup("Processos", "Processos", masterBase.processos || []);
  addMasterGroup("Dietas especiais", "Dietas", masterBase.dietas || []);

  Array.from(grouped.values())
    .filter((group) => group.items.length || group.examples)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .forEach((group) => {
    const card = document.createElement("article");
    card.className = "category-card";
    const uniqueItems = Array.from(new Set(group.items)).sort((a, b) => a.localeCompare(b, "pt-BR"));
    card.innerHTML = `
      <strong>${escapeHtml(group.name)}</strong>
      ${renderCategoryItems(uniqueItems, group.examples)}
      <em>${uniqueItems.length ? plural(uniqueItems.length, "item", "itens") : escapeHtml(group.group)}</em>
    `;
    categoryGrid.appendChild(card);
  });
}

function renderMasterSummary(created = {}) {
  const stats = [
    ["Cardápios", masterBase.cardapios.length, created.cardapios || 0],
    ["Preparações", masterBase.preparacoes.length, created.preparacoes || 0],
    ["Alimentos", masterBase.alimentos.length, created.alimentos || 0],
    ["Processos", masterBase.processos.length, created.processos || 0],
    ["Dietas", masterBase.dietas.length, created.dietas || 0]
  ];

  masterSummary.innerHTML = stats.map(([label, total, added]) => `
    <article>
      <span>${label}</span>
      <strong>${total}</strong>
      <small>${added ? `+${added} novos` : "sem novos"}</small>
    </article>
  `).join("");
}

function detectMeal(normalizedText) {
  return mealDefinitions.find((meal) => meal.terms.some((term) => normalizedText.includes(term))) || null;
}

function detectDayName(normalizedText) {
  const match = dayTerms.find(([term]) => normalizedText.includes(term));
  return match ? match[1] : "";
}

function normalizeYear(value) {
  if (!value) return null;
  const year = Number(value);
  if (!Number.isFinite(year)) return null;
  return year < 100 ? 2000 + year : year;
}

function formatDateParts(parts, includeYear = false) {
  if (!parts || !parts.day || !parts.month) return "";
  const day = String(parts.day).padStart(2, "0");
  const month = String(parts.month).padStart(2, "0");
  return includeYear && parts.year ? `${day}/${month}/${parts.year}` : `${day}/${month}`;
}

function parseDateParts(text) {
  const dateMatch = String(text || "").match(/(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/);
  if (!dateMatch) return null;

  return {
    day: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    year: normalizeYear(dateMatch[3]),
    explicit: true
  };
}

function parseSheetPeriod(sheetName) {
  const normalized = normalizeText(sheetName);
  const cardMatch = normalized.match(/card\s*(\d+)\s*ao\s*(\d+)/);
  const monthMatch = monthTerms.find(([full, short]) => normalized.includes(full) || normalized.includes(short));
  const fourDigitYear = normalized.match(/\b20\d{2}\b/);
  const tailYear = normalized.match(/\b(\d{2})\s*(?:\(|$)/);
  const yearText = fourDigitYear ? fourDigitYear[0] : tailYear ? tailYear[1] : "";

  return {
    startCard: cardMatch ? Number(cardMatch[1]) : null,
    endCard: cardMatch ? Number(cardMatch[2]) : null,
    month: monthMatch ? monthMatch[2] : null,
    year: normalizeYear(yearText)
  };
}

function inferDateFromSheet(header, sheetPeriod) {
  if (!header.cardNumber || !sheetPeriod.month) return null;
  if (sheetPeriod.startCard && header.cardNumber < sheetPeriod.startCard) return null;
  if (sheetPeriod.endCard && header.cardNumber > sheetPeriod.endCard) return null;

  return {
    day: header.cardNumber,
    month: sheetPeriod.month,
    year: sheetPeriod.year,
    explicit: false
  };
}

function buildDateSort(parts, fallback) {
  if (!parts || !parts.day || !parts.month) return fallback;
  const year = parts.year || 2099;
  return (year * 10000) + (parts.month * 100) + parts.day;
}

function parseHeader(row) {
  const normalized = normalizeText(row.text);
  if (!normalized.includes("cardapio")) return null;

  const meal = detectMeal(normalized);
  if (!meal) return null;

  const cardMatch = normalized.match(/cardapio\s*(\d+)/);
  const dateParts = parseDateParts(row.text);

  return {
    rowNumber: row.number,
    cardNumber: cardMatch ? Number(cardMatch[1]) : null,
    mealKey: meal.key,
    mealTitle: meal.title,
    dateParts,
    date: formatDateParts(dateParts, Boolean(dateParts && dateParts.year)),
    dayName: detectDayName(normalized),
    raw: row.text
  };
}

function extractRows(worksheet) {
  const rows = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const cells = [];
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      if (cell.isMerged && cell.master && cell.address !== cell.master.address) return;
      const text = cellToText(cell.value).trim();
      const key = `${colNumber}:${normalizeText(text)}`;
      if (!normalizeText(text) || cells.some((current) => current.key === key)) return;
      cells.push({ colNumber, text });
    });

    if (cells.length) {
      rows.push({
        number: rowNumber,
        cells: cells.sort((a, b) => a.colNumber - b.colNumber),
        text: cells.map((cell) => cell.text).join(" | ")
      });
    }
  });
  return rows;
}

function detectSuggestion(normalizedText) {
  const suggestion = normalizedText.match(/^(sugestao|sug|opcao|alternativa)\s*(\d+)/);
  return suggestion ? `Sugestão ${suggestion[2]}` : "";
}

function getPrefixedCategory(text) {
  const normalized = normalizeText(text);
  const prefixMap = [
    ["entrada fria", "Entrada fria", "Saladas"],
    ["sobremesa", "Sobremesa", "Sobremesas"],
    ["fruta", "Fruta", "Frutas"],
    ["doce", "Doce", "Sobremesas"],
    ["producao diaria", "Produção diária", "Processos"],
    ["opcoes de escolha", "Opções de escolha", "Opções"],
    ["opcao de escolha", "Opções de escolha", "Opções"],
    ["sem leite", "Sem leite", "Dietas"],
    ["geral dm", "Geral DM", "Dietas"]
  ];

  const match = prefixMap.find(([prefix]) => normalized.startsWith(`${prefix}:`) || normalized.startsWith(`${prefix} `));
  if (!match) return null;

  const colonIndex = String(text).indexOf(":");
  return {
    title: match[1],
    category: match[2],
    itemText: colonIndex >= 0 ? cleanItemText(String(text).slice(colonIndex + 1)) : ""
  };
}

function looksLikeDietHeader(text) {
  const normalized = normalizeText(text);
  if (!normalized || normalized.length > 150) return false;
  if (detectSuggestion(normalized)) return false;
  if (getPrefixedCategory(text) && !normalized.startsWith("especial:")) return false;

  const startsLikeDiet = /^(especial|geral|laxativa|branda|pastosa|semi solida|semissolida|infantil|leve|cremosa|dieta liquida|hipossodica|sem gluten|sem leite|zero lactose|hipogordurosa|dbtm)\b/.test(normalized);
  if (!startsLikeDiet) return false;

  const foodSignals = [
    "arroz",
    "feijao",
    "batata",
    "frango",
    "carne",
    "salmao",
    "peixe",
    "cogumelo",
    "mignon",
    "molho",
    "caldo",
    "creme de",
    "sopa",
    "pure de fruta",
    "gelatina",
    "mousse",
    "entrada fria",
    "alface",
    "tomate",
    "abobrinha batido"
  ];

  return !foodSignals.some((signal) => normalized.includes(signal));
}

function normalizeSectionTitle(text) {
  return titleCase(String(text || "").replace(/\s+/g, " ").trim());
}

function splitCellText(text) {
  return String(text || "")
    .replace(/([^0-9])\s*\/\s*([^0-9])/g, "$1\n$2")
    .split(/\r?\n|[•▪●]|;/)
    .map(cleanItemText)
    .filter(Boolean);
}

function cleanItemText(text) {
  return String(text || "")
    .replace(/^[\s\-–—:]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isIgnorableCandidate(text) {
  const normalized = normalizeText(text);
  if (normalized.length < 3 || normalized.length > 260) return true;
  if (/^\d+([.,]\d+)?$/.test(normalized)) return true;
  if (/^\d{1,2}[:h]\d{0,2}$/.test(normalized)) return true;
  if (/^\d{1,2}[./-]\d{1,2}([./-]\d{2,4})?$/.test(normalized)) return true;
  if (controlPatterns.some((pattern) => pattern.test(normalized))) return true;
  if (normalized.includes("cardapio") || normalized.includes("nutrimenu")) return true;
  if (/^(hs|dbtm|com sal|sem sal|sem tempero|sem acucar simples|tudo 1\/2 porcao|1\/2 porcao|na gota)$/.test(normalized)) return true;
  return false;
}

function addRecord(map, name, metadata = {}) {
  const cleanName = titleCase(name);
  const key = normalizeText(cleanName);
  if (!key) return;

  const current = map.get(key) || {
    key,
    name: cleanName,
    category: metadata.category || "",
    count: 0,
    sources: []
  };

  current.count += 1;
  if (metadata.source && !current.sources.includes(metadata.source)) current.sources.push(metadata.source);
  if (metadata.category && !current.category) current.category = metadata.category;
  map.set(key, current);
}

function extractDiets(normalizedText, dietMap, source) {
  dietTerms.forEach(([term, label]) => {
    if (normalizedText.includes(term)) addRecord(dietMap, label, { source });
  });
}

function inferFoods(normalizedText, foodMap, source) {
  foodDictionary.forEach(([name, category, terms]) => {
    if (terms.some((term) => normalizedText.includes(term))) {
      addRecord(foodMap, name, { category, source });
    }
  });
}

function inferPreparationCategory(normalizedText) {
  if (normalizedText.includes("salada")) return "Saladas";
  if (normalizedText.includes("sobremesa") || normalizedText.includes("gelatina") || normalizedText.includes("pudim")) return "Sobremesas";
  if (normalizedText.includes("molho") || normalizedText.includes("caldo") || normalizedText.includes("creme")) return "Processos";
  if (normalizedText.includes("arroz") || normalizedText.includes("feijao") || normalizedText.includes("massa")) return "Grãos";
  if (normalizedText.includes("frango") || normalizedText.includes("carne") || normalizedText.includes("peixe") || normalizedText.includes("ovo")) return "Proteínas";
  if (normalizedText.includes("legume") || normalizedText.includes("cenoura") || normalizedText.includes("abobrinha")) return "Legumes";
  return "Preparações";
}

function isProcess(normalizedText) {
  return processTerms.some((term) => normalizedText.includes(term));
}

function getCellRanges(cells, maxColumn) {
  return cells
    .slice()
    .sort((a, b) => a.colNumber - b.colNumber)
    .map((cell, index, sorted) => ({
      ...cell,
      startCol: cell.colNumber,
      endCol: (sorted[index + 1] ? sorted[index + 1].colNumber - 1 : maxColumn) || cell.colNumber
    }));
}

function applyColumnRange(map, startCol, endCol, value) {
  for (let col = startCol; col <= endCol; col += 1) {
    map.set(col, value);
  }
}

function getColumnValue(map, col, fallback) {
  if (map.has(col)) return map.get(col);
  for (let current = col - 1; current >= 1; current -= 1) {
    if (map.has(current)) return map.get(current);
  }
  return fallback;
}

function groupKey(groupTitle, startCol) {
  return `${normalizeText(groupTitle)}-${startCol}`;
}

function suggestionKey(groupTitle, suggestionTitle, startCol) {
  return `${normalizeText(groupTitle)}-${normalizeText(suggestionTitle)}-${startCol}`;
}

function parseMenuBlock(header, blockRows, sheetName, imported) {
  const groups = new Map();
  const flatSections = new Map();
  const groupByColumn = new Map();
  const suggestionByColumn = new Map();
  const maxColumn = Math.max(...blockRows.flatMap((row) => row.cells.map((cell) => cell.colNumber)), 20);
  const source = `${sheetName} / ${header.mealTitle}${header.cardNumber ? ` ${header.cardNumber}` : ""}`;

  function addFlatSection(category, item) {
    const section = flatSections.get(category) || { title: category, items: [], keys: new Set() };
    const key = normalizeText(item);
    if (!section.keys.has(key)) {
      section.items.push(item);
      section.keys.add(key);
    }
    flatSections.set(category, section);
  }

  function addItem(groupTitle, suggestionTitle, item, explicitCategory, startCol) {
    const clean = titleCase(item);
    const key = normalizeText(clean);
    if (!key) return;

    const category = explicitCategory || inferPreparationCategory(key);
    const normalizedGroupTitle = groupTitle || "Cardápio geral";
    const normalizedSuggestionTitle = suggestionTitle || "Itens gerais";
    const groupId = groupKey(normalizedGroupTitle, startCol);
    const group = groups.get(groupId) || {
      title: normalizedGroupTitle,
      startCol,
      suggestions: new Map()
    };
    const itemSuggestionKey = suggestionKey(normalizedGroupTitle, normalizedSuggestionTitle, startCol);
    const suggestion = group.suggestions.get(itemSuggestionKey) || {
      title: normalizedSuggestionTitle,
      sections: new Map(),
      itemCount: 0
    };
    const section = suggestion.sections.get(category) || { title: category, items: [], keys: new Set() };

    if (!section.keys.has(key)) {
      section.items.push(clean);
      section.keys.add(key);
      suggestion.itemCount += 1;
      addFlatSection(category, clean);
    }

    suggestion.sections.set(category, section);
    group.suggestions.set(itemSuggestionKey, suggestion);
    groups.set(groupId, group);

    addRecord(imported.preparacoes, clean, { category, source });
    inferFoods(key, imported.alimentos, source);
    extractDiets(key, imported.dietas, source);
    if (isProcess(key)) addRecord(imported.processos, clean, { category: "Processos", source });
  }

  blockRows.forEach((row) => {
    const ranges = getCellRanges(row.cells, maxColumn);

    ranges.forEach((cell) => {
      const normalized = normalizeText(cell.text);
      const suggestion = detectSuggestion(normalized);
      if (suggestion) {
        applyColumnRange(suggestionByColumn, cell.startCol, cell.endCol, suggestion);
      }

      if (looksLikeDietHeader(cell.text)) {
        const sectionTitle = normalizeSectionTitle(cell.text);
        applyColumnRange(groupByColumn, cell.startCol, cell.endCol, sectionTitle);
        extractDiets(normalized, imported.dietas, source);
      }
    });

    ranges.forEach((cell) => {
      if (detectSuggestion(normalizeText(cell.text)) || looksLikeDietHeader(cell.text)) return;

      const groupTitle = getColumnValue(groupByColumn, cell.colNumber, "Cardápio geral");
      const suggestionTitle = getColumnValue(suggestionByColumn, cell.colNumber, "Itens gerais");
      splitCellText(cell.text).forEach((segment) => {
        const normalized = normalizeText(segment);
        if (detectSuggestion(normalized)) return;
        if (looksLikeDietHeader(segment)) {
          applyColumnRange(groupByColumn, cell.startCol, cell.endCol, normalizeSectionTitle(segment));
          extractDiets(normalized, imported.dietas, source);
          return;
        }

        const prefixed = getPrefixedCategory(segment);
        const itemText = prefixed && prefixed.itemText ? prefixed.itemText : segment;
        if (isIgnorableCandidate(segment)) return;
        if (isIgnorableCandidate(itemText)) return;
        addItem(groupTitle, suggestionTitle, itemText, prefixed ? prefixed.category : "", cell.startCol);
      });
    });
  });

  const normalizedGroups = Array.from(groups.values()).map((group) => ({
    title: group.title,
    suggestions: Array.from(group.suggestions.values()).map((suggestion) => ({
      title: suggestion.title,
      itemCount: suggestion.itemCount,
      sections: Array.from(suggestion.sections.values()).map((section) => ({
        title: section.title,
        items: section.items
      }))
    }))
  })).filter((group) => group.suggestions.length);

  const normalizedSections = Array.from(flatSections.values()).map((section) => ({
    title: section.title,
    items: section.items
  }));

  const itemCount = normalizedGroups.reduce(
    (total, group) => total + group.suggestions.reduce((groupTotal, suggestion) => groupTotal + suggestion.itemCount, 0),
    0
  );

  return {
    key: normalizeText(`${sheetName}-${header.rowNumber}-${header.cardNumber || "sem-numero"}-${header.mealKey}-${header.date || ""}`),
    name: `${header.cardNumber ? `Cardápio ${header.cardNumber} - ` : ""}${header.mealTitle}`,
    sheetName,
    sheetIndex: header.sheetIndex,
    rowNumber: header.rowNumber,
    cardNumber: header.cardNumber,
    mealKey: header.mealKey,
    mealTitle: header.mealTitle,
    date: header.date,
    dateParts: header.dateParts,
    dayName: header.dayName,
    title: `${header.cardNumber ? `Cardápio ${header.cardNumber} - ` : ""}${header.mealTitle}`,
    category: "Cardápios",
    count: 1,
    sources: [source],
    itemCount,
    groups: normalizedGroups,
    sections: normalizedSections
  };
}

function parseWorksheet(worksheet, imported, sheetIndex) {
  const rows = extractRows(worksheet);
  const sheetPeriod = parseSheetPeriod(worksheet.name);
  const headers = rows.map(parseHeader).filter(Boolean).map((header) => {
    const inferredDate = header.dateParts || inferDateFromSheet(header, sheetPeriod);
    const dateParts = inferredDate && sheetPeriod.year && !inferredDate.year && inferredDate.month === sheetPeriod.month
      ? { ...inferredDate, year: sheetPeriod.year }
      : inferredDate;

    return {
      ...header,
      sheetIndex,
      dateParts,
      date: formatDateParts(dateParts, Boolean(dateParts && dateParts.year))
    };
  });

  if (!headers.length) {
    imported.ignoredSheets.push(worksheet.name);
    return;
  }

  imported.menuSheets.push(worksheet.name);

  headers.forEach((header, index) => {
    const nextHeader = headers[index + 1];
    const blockRows = rows.filter((row) => row.number > header.rowNumber && (!nextHeader || row.number < nextHeader.rowNumber));
    const menu = parseMenuBlock(header, blockRows, worksheet.name, imported);
    imported.cardapios.push(menu);
  });
}

function buildDayIndex(cardapios) {
  const days = new Map();

  cardapios.forEach((menu, index) => {
    const dateText = menu.date || "";
    const fallbackLabel = menu.cardNumber ? `Cardápio ${menu.cardNumber}` : `Bloco ${index + 1}`;
    const key = normalizeText(`${menu.sheetName}-${dateText || fallbackLabel}-${menu.cardNumber || index}`);
    const dateSort = buildDateSort(menu.dateParts, (menu.sheetIndex || 0) * 10000 + (menu.rowNumber || index));
    const existing = days.get(key) || {
      key,
      dateText,
      dayName: menu.dayName || "",
      cardNumber: menu.cardNumber,
      sheetName: menu.sheetName,
      sheetIndex: menu.sheetIndex || 0,
      sort: dateSort,
      meals: {}
    };

    if (!existing.meals[menu.mealKey]) existing.meals[menu.mealKey] = [];
    existing.meals[menu.mealKey].push(menu);
    if (!existing.dayName && menu.dayName) existing.dayName = menu.dayName;
    if (!existing.dateText && dateText) existing.dateText = dateText;
    days.set(key, existing);
  });

  return Array.from(days.values())
    .map((day) => ({
      ...day,
      title: day.dayName || (day.dateText ? `Dia ${day.dateText.split("/")[0]}` : day.cardNumber ? `Cardápio ${day.cardNumber}` : "Dia importado"),
      subtitle: day.dateText || (day.cardNumber ? `Cardápio ${day.cardNumber}` : day.sheetName),
      mealCount: Object.values(day.meals).reduce((total, menus) => total + menus.length, 0)
    }))
    .sort((a, b) => a.sort - b.sort || String(a.sheetName).localeCompare(String(b.sheetName), "pt-BR"));
}

function buildPeriodLabel(days) {
  const sheetNames = Array.from(new Set(days.map((day) => day.sheetName)));
  if (sheetNames.length > 1) return `${sheetNames.length} períodos identificados`;

  const datedDays = days.filter((day) => day.dateText);
  if (!datedDays.length) return `${days.length} dia(s) identificados`;
  const first = datedDays[0].dateText;
  const last = datedDays[datedDays.length - 1].dateText;
  return first === last ? first : `${first} a ${last}`;
}

function buildSheetPeriodDescriptions(days) {
  const bySheet = new Map();
  days.forEach((day) => {
    const current = bySheet.get(day.sheetName) || [];
    current.push(day);
    bySheet.set(day.sheetName, current);
  });

  return Array.from(bySheet.entries()).map(([sheetName, sheetDays]) => {
    const datedDays = sheetDays.filter((day) => day.dateText);
    const first = datedDays[0];
    const last = datedDays[datedDays.length - 1];
    const period = first && last ? `${first.dateText} a ${last.dateText}` : `${sheetDays.length} dia(s)`;
    return { sheetName, period, label: period };
  });
}

async function parseWorkbook(file) {
  if (!window.ExcelJS) {
    throw new Error("A biblioteca de leitura do Excel não carregou. Recarregue a página e tente novamente.");
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const imported = {
    fileName: file.name,
    importedAt: new Date().toISOString(),
    sheetCount: workbook.worksheets.length,
    menuSheets: [],
    ignoredSheets: [],
    cardapios: [],
    alimentos: new Map(),
    preparacoes: new Map(),
    processos: new Map(),
    dietas: new Map(),
    warnings: []
  };

  workbook.eachSheet((worksheet, sheetId) => parseWorksheet(worksheet, imported, sheetId));
  imported.days = buildDayIndex(imported.cardapios);
  imported.periodLabel = buildPeriodLabel(imported.days);
  imported.periods = buildSheetPeriodDescriptions(imported.days);

  if (!imported.cardapios.length) {
    imported.warnings.push("Nenhum bloco de cardápio foi reconhecido.");
  }

  const menusWithoutDate = imported.cardapios.filter((menu) => !menu.date && !menu.cardNumber).length;
  if (menusWithoutDate) {
    imported.warnings.push(`${menusWithoutDate} cardápios não têm data explícita no cabeçalho.`);
  }

  const hasCafe = imported.cardapios.some((menu) => menu.mealKey === "cafe");
  if (!hasCafe) {
    imported.warnings.push("Café da manhã não apareceu como bloco de cardápio nesta planilha.");
  }

  if (imported.ignoredSheets.length) {
    imported.warnings.push(`${imported.ignoredSheets.length} aba(s) não parecem ser cardápio.`);
  }

  return {
    ...imported,
    days: imported.days,
    periods: imported.periods,
    alimentos: Array.from(imported.alimentos.values()),
    preparacoes: Array.from(imported.preparacoes.values()),
    processos: Array.from(imported.processos.values()),
    dietas: Array.from(imported.dietas.values())
  };
}

function mergeCollection(collectionName, records) {
  const existing = new Map((masterBase[collectionName] || []).map((record) => [record.key, record]));
  let created = 0;

  records.forEach((record) => {
    const sources = Array.isArray(record.sources) ? record.sources : [];

    if (!existing.has(record.key)) {
      existing.set(record.key, { ...record, sources });
      created += 1;
      return;
    }

    const current = existing.get(record.key);
    current.count = (current.count || 0) + (record.count || 1);
    current.sources = Array.isArray(current.sources) ? current.sources : [];
    sources.forEach((source) => {
      if (!current.sources.includes(source)) current.sources.push(source);
    });
  });

  masterBase[collectionName] = Array.from(existing.values()).sort((a, b) => {
    const left = a.name || a.title || a.key;
    const right = b.name || b.title || b.key;
    return left.localeCompare(right, "pt-BR");
  });
  return created;
}

function mergeImportedData(imported) {
  if (window.NutriMenuPersistence && window.NutriMenuPersistence.mergeImportedData) {
    const result = window.NutriMenuPersistence.mergeImportedData(masterBase, imported);
    masterBase = result.masterBase;
    saveMasterBase();
    return result.created;
  }

  const created = {
    alimentos: mergeCollection("alimentos", imported.alimentos),
    preparacoes: mergeCollection("preparacoes", imported.preparacoes),
    processos: mergeCollection("processos", imported.processos),
    dietas: mergeCollection("dietas", imported.dietas),
    cardapios: mergeCollection("cardapios", imported.cardapios)
  };

  saveMasterBase();
  return created;
}

function renderDayTabs(imported) {
  if (!imported.days.length) {
    dayTabs.hidden = true;
    dayTabs.innerHTML = "";
    return;
  }

  dayTabs.hidden = false;
  dayTabs.innerHTML = imported.days.map((day) => `
    <button class="day-tab ${day.key === selectedDayKey ? "active" : ""}" type="button" data-day-key="${escapeHtml(day.key)}">
      <strong>${escapeHtml(day.title)}</strong>
      <span>${escapeHtml(day.subtitle)}</span>
    </button>
  `).join("");

  const activeDay = dayTabs.querySelector(".day-tab.active");
  if (activeDay) activeDay.scrollIntoView({ block: "nearest", inline: "start" });
}

function getSelectedDay() {
  if (!currentImported || !currentImported.days.length) return null;
  return currentImported.days.find((item) => item.key === selectedDayKey) || currentImported.days[0];
}

function getSelectedMealDefinition() {
  return mealDefinitions.find((meal) => meal.key === selectedMealKey) || mealDefinitions[1];
}

function chooseDefaultMealKey(day) {
  const preferredOrder = ["almoco", "jantar", "cafe"];
  return preferredOrder.find((mealKey) => (day && day.meals && day.meals[mealKey] || []).length) || "almoco";
}

function renderMealSelector(day = null) {
  if (!mealSelector) return;

  mealSelector.innerHTML = mealDefinitions.map((meal) => {
    const menus = day && day.meals ? day.meals[meal.key] || [] : [];
    const itemCount = menus.reduce((total, menu) => total + (menu.itemCount || 0), 0);
    const meta = day
      ? menus.length ? `${plural(menus.length, "cardápio", "cardápios")} · ${plural(itemCount, "item", "itens")}` : "Sem dados"
      : "Aguardando Excel";
    const activeClass = day && meal.key === selectedMealKey ? "active" : "";

    return `
      <button class="side-meal ${activeClass}" type="button" data-meal-filter="${meal.key}" data-empty="${menus.length ? "false" : "true"}">
        <span>${escapeHtml(meal.title)}</span>
        <small>${escapeHtml(meta)}</small>
      </button>
    `;
  }).join("");
}

function renderSelectedDay() {
  if (!currentImported || !currentImported.days.length) return;
  const day = getSelectedDay();
  selectedDayKey = day.key;
  const dateLabel = day.dateText ? `Dia ${day.dateText}` : day.subtitle;
  const selectedMeal = getSelectedMealDefinition();
  const menus = day.meals[selectedMeal.key] || [];

  mealSectionTitle.textContent = `Cardápio de ${day.title}`;
  mealSectionSubtitle.textContent = `${dateLabel} · ${selectedMeal.title}`;
  validationPill.textContent = menus.length ? plural(menus.length, "cardápio", "cardápios") : "Sem dados";
  mealGrid.hidden = false;
  mealGrid.className = "meal-grid day-board meal-focus";
  mealGrid.innerHTML = renderDayMealCard(selectedMeal, menus);
  renderMealSelector(day);
  renderDayTabs(currentImported);
}

function renderDayMealCard(meal, menus) {
  const totalItems = menus.reduce((total, menu) => total + menu.itemCount, 0);
  const mealClass = meal.key === "cafe" ? "breakfast" : meal.key === "almoco" ? "lunch" : "dinner";

  if (!menus.length) {
    return `
      <article class="meal-card ${mealClass} selected-meal-card">
        <div class="meal-head">
          ${renderMealIcon(meal.key)}
          <div>
            <h3>${escapeHtml(meal.title)}</h3>
            <p>Não encontrado neste dia.</p>
          </div>
        </div>
        <div class="meal-body empty-meal"><span></span><span></span><span></span></div>
        <button class="ghost-action" type="button">Sem dados</button>
      </article>
    `;
  }

  return `
    <article class="meal-card ${mealClass} imported day-meal-card selected-meal-card">
      <div class="meal-head">
        ${renderMealIcon(meal.key)}
        <div>
          <h3>${escapeHtml(meal.title)}</h3>
          <p>${plural(menus.length, "cardápio", "cardápios")}, ${plural(totalItems, "item", "itens")} reconhecidos.</p>
        </div>
      </div>
      <div class="meal-body imported-meal day-meal">
        ${menus.map((menu) => renderMenuBlock(menu)).join("")}
      </div>
    </article>
  `;
}

function renderMealIcon(mealKey) {
  if (mealKey === "cafe") {
    return `
      <span class="meal-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v3"></path><path d="M12 19v3"></path><path d="M4.9 4.9 7 7"></path><path d="m17 17 2.1 2.1"></path><path d="M2 12h3"></path><path d="M19 12h3"></path><path d="m4.9 19.1 2.1-2.1"></path><path d="m17 7 2.1-2.1"></path></svg>
      </span>
    `;
  }

  if (mealKey === "almoco") {
    return `
      <span class="meal-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M7 3v18"></path><path d="M11 3v7a4 4 0 0 1-8 0V3"></path><path d="M17 3v18"></path><path d="M17 3c2.5 1.4 4 4.1 4 7.5 0 3.5-1.5 6.2-4 7.5"></path></svg>
      </span>
    `;
  }

  return `
    <span class="meal-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M20 14.2A8 8 0 1 1 9.8 4a6.5 6.5 0 0 0 10.2 10.2Z"></path></svg>
    </span>
  `;
}

function renderMenuBlock(menu) {
  const groups = Array.isArray(menu.groups) ? menu.groups : [];

  if (!groups.length) {
    return `
      <div class="menu-block-empty">
        <strong>${escapeHtml(menu.title)}</strong>
        <span>Nenhum item de cardápio foi separado neste bloco.</span>
      </div>
    `;
  }

  const itemCount = groups.reduce((total, group) => (
    total + group.suggestions.reduce((groupTotal, suggestion) => groupTotal + suggestion.itemCount, 0)
  ), 0);

  return `
    <details class="recognized-block menu-shell" open>
      <summary>
        <span>${escapeHtml(menu.title)}</span>
        <em>${plural(groups.length, "tipo", "tipos")} · ${plural(itemCount, "item", "itens")}</em>
      </summary>
      <div class="menu-group-stack">
        ${groups.map((group) => renderDietGroup(group, false)).join("")}
      </div>
    </details>
  `;
}

function renderDietGroup(group, open) {
  const itemCount = group.suggestions.reduce((total, suggestion) => total + suggestion.itemCount, 0);

  return `
    <details class="diet-block" ${open ? "open" : ""}>
      <summary>
        <span class="summary-plus" aria-hidden="true"></span>
        <span>${escapeHtml(group.title)}</span>
        <em>${plural(group.suggestions.length, "sugestão", "sugestões")} · ${plural(itemCount, "item", "itens")}</em>
      </summary>
      <div class="suggestion-grid">
        ${group.suggestions.map((suggestion) => renderSuggestionCard(suggestion)).join("")}
      </div>
    </details>
  `;
}

function renderSuggestionCard(suggestion) {
  const dishes = Array.isArray(suggestion.dishes) ? suggestion.dishes : [];
  const fallbackItems = flattenSuggestionItems(suggestion);
  const countLabel = suggestion.itemCount
    ? plural(suggestion.itemCount, "componente", "componentes")
    : plural(dishes.length || fallbackItems.length, "preparação", "preparações");

  return `
    <article class="suggestion-card">
      <header class="suggestion-card-header">
        <strong>${escapeHtml(suggestion.title)}</strong>
        <span>${escapeHtml(countLabel)}</span>
      </header>
      ${dishes.length ? `
        <div class="dish-stack simple-dish-stack">
          ${dishes.map(renderDishCard).join("")}
        </div>
      ` : `
        <div class="dish-stack simple-dish-stack">
          ${fallbackItems.map((item) => `<section class="dish-card dish-line"><strong>${escapeHtml(item)}</strong></section>`).join("")}
        </div>
      `}
    </article>
  `;
}

function renderDishCard(dish) {
  const componentCount = Array.isArray(dish.components) ? dish.components.length : 0;

  return `
    <section class="dish-card dish-line">
      <strong>${escapeHtml(dish.name)}</strong>
      ${componentCount > 1 ? `<small>${plural(componentCount, "componente", "componentes")}</small>` : ""}
    </section>
  `;
}

function flattenSuggestionItems(suggestion) {
  return (suggestion.sections || [])
    .flatMap((section) => section.items || [])
    .filter(Boolean);
}

function buildSectionsFromComponents(components) {
  const groups = new Map();
  components.forEach((component) => {
    const title = component.category || "Preparações";
    const current = groups.get(title) || { title, items: [] };
    if (!current.items.some((item) => normalizeText(item) === normalizeText(component.name))) {
      current.items.push(component.name);
    }
    groups.set(title, current);
  });
  return Array.from(groups.values());
}

function renderSectionPreview(section) {
  return `
    <section class="category-list">
      <strong>${escapeHtml(section.title)}</strong>
      <ul>
        ${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </section>
  `;
}

function renderReview(imported, created) {
  importReview.hidden = false;
  const periodLines = imported.periods.map((period) => `${period.sheetName}: ${period.period}.`);
  const lines = [
    `${plural(imported.days.length, "dia", "dias")} e ${plural(imported.cardapios.length, "refeição", "refeições")} identificados em ${plural(imported.menuSheets.length, "aba", "abas")}.`,
    ...periodLines,
    `${plural(created.preparacoes, "preparação", "preparações")}, ${plural(created.alimentos, "alimento", "alimentos")}, ${plural(created.processos, "processo", "processos")} e ${plural(created.dietas, "dieta", "dietas")} cadastrados como novos.`
  ].concat(imported.warnings);

  reviewList.innerHTML = lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
}

function renderImportedState(imported, created) {
  currentImported = imported;
  selectedDayKey = (imported.days.find((day) => day.dateText && day.dateText.startsWith("24/")) || imported.days.find((day) => day.dateText) || imported.days[0] || {}).key || "";
  selectedMealKey = chooseDefaultMealKey(getSelectedDay());
  validationPill.textContent = "Excel interpretado";
  validationPill.classList.add("selected-file");
  datePickerLabel.textContent = `${plural(imported.days.length, "dia importado", "dias importados")}`;
  summaryLabel.textContent = "Arquivo lido localmente";
  summaryTitle.textContent = imported.periodLabel;
  summaryText.textContent = `${plural(imported.days.length, "dia", "dias")} e ${plural(imported.cardapios.length, "refeição", "refeições")}. Períodos: ${imported.periods.map((period) => period.label).join("; ")}.`;
  renderSelectedDay();
  renderMasterSummary(created);
  renderCategories();
  renderReview(imported, created);
}

function renderError(message) {
  currentImported = null;
  selectedDayKey = "";
  selectedMealKey = "almoco";
  dayTabs.hidden = true;
  dayTabs.innerHTML = "";
  validationPill.textContent = "Importação pendente";
  validationPill.classList.remove("selected-file");
  summaryLabel.textContent = "Revisão necessária";
  summaryTitle.textContent = "Excel não interpretado";
  summaryText.textContent = message;
  mealSectionTitle.textContent = "Cardápio";
  mealSectionSubtitle.textContent = "Importe uma planilha válida para carregar as refeições.";
  mealGrid.hidden = true;
  mealGrid.innerHTML = "";
  renderMealSelector();
}

function renderEmptyImportState() {
  currentImported = null;
  selectedDayKey = "";
  selectedMealKey = "almoco";
  dayTabs.hidden = true;
  dayTabs.innerHTML = "";
  importReview.hidden = true;
  reviewList.innerHTML = "";
  validationPill.textContent = "Aguardando Excel";
  validationPill.classList.remove("selected-file");
  datePickerLabel.textContent = "Nenhuma semana importada";
  summaryLabel.textContent = "Cardápio";
  summaryTitle.textContent = "Aguardando importação";
  summaryText.textContent = "Depois do Excel, esta área será preenchida com semanas, dias, sugestões e dietas.";
  mealSectionTitle.textContent = "Cardápio";
  mealSectionSubtitle.textContent = "Importe o Excel para carregar os dias e liberar Café da Manhã, Almoço e Jantar.";
  mealGrid.hidden = true;
  mealGrid.innerHTML = "";
  renderMealSelector();
  renderMasterSummary();
  renderCategories();
}

categoryForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = categoryName.value.trim();
  if (!name) return;

  const exists = categories.some(([category]) => normalizeText(category) === normalizeText(name));
  if (!exists) {
    categories.push([name, categoryGroup.value, ""]);
    saveCategories();
    renderCategories();
  }

  categoryName.value = "";
});

dayTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-day-key]");
  if (!button || !currentImported) return;
  selectedDayKey = button.dataset.dayKey;
  renderSelectedDay();
});

if (mealSelector) {
  mealSelector.addEventListener("click", (event) => {
    const button = event.target.closest("[data-meal-filter]");
    if (!button) return;
    selectedMealKey = button.dataset.mealFilter || "almoco";
    if (currentImported) {
      renderSelectedDay();
      return;
    }
    renderMealSelector();
  });
}

function setMasterBaseVisible(visible) {
  if (!masterBaseSection) return;
  masterBaseSection.hidden = !visible;
  if (masterBaseNav) masterBaseNav.classList.toggle("active", visible);
  if (visible) masterBaseSection.scrollIntoView({ block: "start", behavior: "smooth" });
}

if (masterBaseNav) {
  masterBaseNav.addEventListener("click", (event) => {
    event.preventDefault();
    setMasterBaseVisible(!masterBaseSection || masterBaseSection.hidden);
  });
}

if (closeMasterBase) {
  closeMasterBase.addEventListener("click", () => setMasterBaseVisible(false));
}

if (clearLocalData) {
  clearLocalData.addEventListener("click", () => {
    window.localStorage.removeItem(categoryStorageKey);
    window.localStorage.removeItem(legacyCategoryStorageKey);
    window.localStorage.removeItem(baseStorageKey);
    window.localStorage.removeItem(legacyBaseStorageKey);
    [
      "nutrimenu-categorias-empty-v1",
      "nutrimenu-categorias-empty-v2",
      "nutrimenu-categorias-empty-v3",
      "nutrimenu-base-mestre-structured-v2",
      "nutrimenu-base-mestre-auto-v3",
      "nutrimenu-base-mestre-guided-v1",
      "nutrimenu-import-profile-guided-v1"
    ].forEach((key) => window.localStorage.removeItem(key));
    categories = copyValue(initialCategories);
    masterBase = emptyBase();
    if (excelInput) excelInput.value = "";
    setMasterBaseVisible(false);
    renderEmptyImportState();
  });
}

excelInput.addEventListener("change", async () => {
  const file = excelInput.files && excelInput.files[0];
  if (!file) return;

  if (!file.name.toLocaleLowerCase("pt-BR").endsWith(".xlsx")) {
    renderError("Use um arquivo .xlsx exportado do Excel. Formatos antigos .xls serão tratados em uma etapa separada.");
    return;
  }

  validationPill.textContent = "Lendo Excel";
  summaryLabel.textContent = "Processamento local";
  summaryTitle.textContent = "Interpretando planilha";
  summaryText.textContent = "O arquivo está sendo lido no navegador. Nada é enviado para servidor nesta etapa.";
  mealGrid.hidden = true;
  mealGrid.innerHTML = "";

  try {
    const parseExcel = window.NutriMenuImporter && window.NutriMenuImporter.parseWorkbook
      ? window.NutriMenuImporter.parseWorkbook
      : parseWorkbook;
    const imported = await parseExcel(file);
    const created = mergeImportedData(imported);
    renderImportedState(imported, created);
  } catch (error) {
    renderError(error.message || "Não foi possível interpretar o arquivo selecionado.");
  }
});

renderEmptyImportState();
