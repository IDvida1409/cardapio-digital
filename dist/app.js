const categoryStorageKey = "nutrimenu-categorias";
const baseStorageKey = "nutrimenu-base-mestre";

const initialCategories = [
  ["Legumes", "Alimentos", "Abobrinha, cenoura, chuchu, beterraba"],
  ["Verduras", "Alimentos", "Alface, couve, rúcula, acelga"],
  ["Grãos", "Alimentos", "Arroz, feijão, lentilha, grão-de-bico"],
  ["Proteínas", "Alimentos", "Frango, carne, peixe, ovos"],
  ["Frutas", "Alimentos", "Banana, mamão, maçã, melancia"],
  ["Sobremesas", "Alimentos", "Gelatina, compota, doce diet"],
  ["Dietas especiais", "Dietas", "Hipossódica, diabética, sem lactose"],
  ["Texturas", "Dietas", "Branda, pastosa, líquida, semissólida"],
  ["Guarnições", "Pratos", "Purê, legumes cozidos, farofa"],
  ["Saladas", "Pratos", "Cruas, cozidas, compostas"],
  ["Processos", "Processos", "Molhos, caldos, bases e refogados"],
  ["Molhos", "Processos", "Bolonhesa, sugo, branco, madeira"]
];

const mealDefinitions = [
  { key: "cafe", title: "Café da Manhã", label: "Itens serão carregados pela planilha.", terms: ["cafe da manha", "desjejum"] },
  { key: "almoco", title: "Almoço", label: "Sugestões, dietas e opções aparecerão aqui.", terms: ["almoco"] },
  { key: "jantar", title: "Jantar", label: "Preparações e processos serão vinculados depois.", terms: ["jantar"] }
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

function renderCategories() {
  categoryGrid.innerHTML = "";
  categories.forEach(([name, group, examples]) => {
    const card = document.createElement("article");
    card.className = "category-card";
    card.innerHTML = `
      <strong>${escapeHtml(name)}</strong>
      <span>${escapeHtml(examples)}</span>
      <em>${escapeHtml(group)}</em>
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

function parseHeader(row) {
  const normalized = normalizeText(row.text);
  if (!normalized.includes("cardapio")) return null;

  const meal = detectMeal(normalized);
  if (!meal) return null;

  const cardMatch = normalized.match(/cardapio\s*(\d+)/);
  const dateMatch = row.text.match(/(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/);

  return {
    rowNumber: row.number,
    cardNumber: cardMatch ? Number(cardMatch[1]) : null,
    mealKey: meal.key,
    mealTitle: meal.title,
    date: dateMatch ? dateMatch[0] : null,
    raw: row.text
  };
}

function extractRows(worksheet) {
  const rows = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const cells = [];
    const seen = new Set();

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const text = cellToText(cell.value).trim();
      const key = normalizeText(text);
      if (!key || seen.has(key)) return;
      seen.add(key);
      cells.push({ colNumber, text });
    });

    if (cells.length) {
      rows.push({
        number: rowNumber,
        cells,
        text: cells.map((cell) => cell.text).join(" | ")
      });
    }
  });
  return rows;
}

function detectSection(normalizedText) {
  const suggestion = normalizedText.match(/sugestao\s*(\d+)/);
  if (suggestion) return `Sugestão ${suggestion[1]}`;
  if (normalizedText.includes("opcoes de escolha") || normalizedText.includes("opcao de escolha")) return "Opções de escolha";
  if (normalizedText.includes("sobremesa")) return "Sobremesa";
  if (normalizedText.includes("salada")) return "Salada";
  if (normalizedText.includes("fruta")) return "Fruta";

  const diet = dietTerms.find(([term]) => normalizedText.includes(term));
  if (diet) return diet[1] === "Geral" ? "Dieta geral" : `Dieta ${diet[1]}`;

  return "";
}

function splitCellText(text) {
  return String(text || "")
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
  if (normalized.length < 3 || normalized.length > 140) return true;
  if (/^\d+([.,]\d+)?$/.test(normalized)) return true;
  if (/^\d{1,2}[:h]\d{0,2}$/.test(normalized)) return true;
  if (/^\d{1,2}[./-]\d{1,2}([./-]\d{2,4})?$/.test(normalized)) return true;
  if (controlPatterns.some((pattern) => pattern.test(normalized))) return true;
  if (normalized.includes("cardapio") || normalized.includes("nutrimenu")) return true;
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

function parseMenuBlock(header, blockRows, sheetName, imported) {
  const sections = new Map();
  let currentSection = "Itens identificados";
  const source = `${sheetName} / ${header.mealTitle}${header.cardNumber ? ` ${header.cardNumber}` : ""}`;

  function addItem(sectionName, item) {
    const clean = titleCase(item);
    const key = normalizeText(clean);
    if (!key) return;

    const section = sections.get(sectionName) || { title: sectionName, items: [], keys: new Set() };
    if (!section.keys.has(key)) {
      section.items.push(clean);
      section.keys.add(key);
    }
    sections.set(sectionName, section);

    const category = inferPreparationCategory(key);
    addRecord(imported.preparacoes, clean, { category, source });
    inferFoods(key, imported.alimentos, source);
    extractDiets(key, imported.dietas, source);
    if (isProcess(key)) addRecord(imported.processos, clean, { category: "Processos", source });
  }

  blockRows.forEach((row) => {
    const rowSection = detectSection(normalizeText(row.text));
    if (rowSection) {
      currentSection = rowSection;
      extractDiets(normalizeText(row.text), imported.dietas, source);
    }

    row.cells.forEach((cell) => {
      splitCellText(cell.text).forEach((segment) => {
        const normalized = normalizeText(segment);
        const segmentSection = detectSection(normalized);
        if (segmentSection && normalizeText(segmentSection) === normalized) return;
        if (isIgnorableCandidate(segment)) return;
        addItem(currentSection, segment);
      });
    });
  });

  const normalizedSections = Array.from(sections.values()).map((section) => ({
    title: section.title,
    items: section.items
  }));

  const itemCount = normalizedSections.reduce((total, section) => total + section.items.length, 0);

  return {
    key: normalizeText(`${sheetName}-${header.rowNumber}-${header.cardNumber || "sem-numero"}-${header.mealKey}`),
    name: `${header.cardNumber ? `Cardápio ${header.cardNumber} - ` : ""}${header.mealTitle}`,
    sheetName,
    cardNumber: header.cardNumber,
    mealKey: header.mealKey,
    mealTitle: header.mealTitle,
    date: header.date,
    title: `${header.cardNumber ? `Cardápio ${header.cardNumber} - ` : ""}${header.mealTitle}`,
    category: "Cardápios",
    count: 1,
    sources: [source],
    itemCount,
    sections: normalizedSections
  };
}

function parseWorksheet(worksheet, imported) {
  const rows = extractRows(worksheet);
  const headers = rows.map(parseHeader).filter(Boolean);

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

  workbook.eachSheet((worksheet) => parseWorksheet(worksheet, imported));

  if (!imported.cardapios.length) {
    imported.warnings.push("Nenhum bloco de cardápio foi reconhecido.");
  }

  const menusWithoutDate = imported.cardapios.filter((menu) => !menu.date).length;
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

function renderMealCards(imported) {
  mealDefinitions.forEach((meal) => {
    const card = document.querySelector(`[data-meal-card="${meal.key}"]`);
    const body = document.querySelector(`[data-meal-body="${meal.key}"]`);
    const status = card.querySelector(".ghost-action");
    const subtitle = card.querySelector(".meal-head p");
    const menus = imported.cardapios.filter((menu) => menu.mealKey === meal.key);

    if (!menus.length) {
      card.classList.remove("imported");
      body.className = "meal-body empty-meal";
      body.innerHTML = "<span></span><span></span><span></span>";
      subtitle.textContent = meal.key === "cafe" ? "Não encontrado nesta planilha." : meal.label;
      status.textContent = "Sem dados";
      return;
    }

    card.classList.add("imported");
    body.className = "meal-body imported-meal";
    subtitle.textContent = `${menus.length} cardápio(s) reconhecido(s).`;
    status.textContent = `${menus.reduce((total, menu) => total + menu.itemCount, 0)} itens`;
    body.innerHTML = menus.slice(0, 3).map((menu, index) => renderMenuPreview(menu, index === 0)).join("");
  });
}

function renderMenuPreview(menu, open) {
  const sections = menu.sections.filter((section) => section.items.length).slice(0, 4);

  return `
    <details class="recognized-block" ${open ? "open" : ""}>
      <summary>
        <span>${escapeHtml(menu.title)}</span>
        <em>${menu.itemCount} itens</em>
      </summary>
      <div class="section-list">
        ${sections.map(renderSectionPreview).join("")}
      </div>
    </details>
  `;
}

function renderSectionPreview(section) {
  return `
    <section>
      <strong>${escapeHtml(section.title)}</strong>
      <ul>
        ${section.items.slice(0, 6).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </section>
  `;
}

function renderReview(imported, created) {
  importReview.hidden = false;
  const lines = [
    `${imported.cardapios.length} cardápio(s) identificados em ${imported.menuSheets.length} aba(s).`,
    `${created.preparacoes} preparação(ões), ${created.alimentos} alimento(s), ${created.processos} processo(s) e ${created.dietas} dieta(s) cadastrados como novos.`
  ].concat(imported.warnings);

  reviewList.innerHTML = lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
}

function renderImportedState(imported, created) {
  validationPill.textContent = "Excel interpretado";
  validationPill.classList.add("selected-file");
  datePickerLabel.textContent = `${imported.cardapios.length} cardápio(s) importados`;
  summaryLabel.textContent = "Arquivo lido localmente";
  summaryTitle.textContent = imported.fileName;
  summaryText.textContent = `${imported.preparacoes.length} preparações, ${imported.alimentos.length} alimentos, ${imported.processos.length} processos e ${imported.dietas.length} dietas foram identificados.`;
  mealSectionTitle.textContent = "Cardápios reconhecidos";
  mealSectionSubtitle.textContent = "Dados extraídos da planilha, sem cadastro manual.";
  renderMealCards(imported);
  renderMasterSummary(created);
  renderReview(imported, created);
}

function renderError(message) {
  validationPill.textContent = "Importação pendente";
  summaryLabel.textContent = "Revisão necessária";
  summaryTitle.textContent = "Excel não interpretado";
  summaryText.textContent = message;
}

categoryForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = categoryName.value.trim();
  if (!name) return;

  const exists = categories.some(([category]) => normalizeText(category) === normalizeText(name));
  if (!exists) {
    categories.push([name, categoryGroup.value, "Categoria cadastrada para a base mestre"]);
    saveCategories();
    renderCategories();
  }

  categoryName.value = "";
});

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

  try {
    const imported = await parseWorkbook(file);
    const created = mergeImportedData(imported);
    renderImportedState(imported, created);
  } catch (error) {
    renderError(error.message || "Não foi possível interpretar o arquivo selecionado.");
  }
});

renderCategories();
renderMasterSummary();
