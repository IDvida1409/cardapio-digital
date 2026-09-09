(function attachNutriMenuParser(window) {
  const core = window.NutriMenuCore;

  const mealDefinitions = [
    { key: "cafe", title: "Café da Manhã", terms: ["cafe da manha", "desjejum"] },
    { key: "almoco", title: "Almoço", terms: ["almoco"] },
    { key: "jantar", title: "Jantar", terms: ["jantar"] }
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
    ["dbtm", "Diabética"],
    ["sem lactose", "Sem lactose"],
    ["zero lactose", "Sem lactose"],
    ["sem gluten", "Sem glúten"],
    ["hipogordurosa", "Hipogordurosa"],
    ["sem leite", "Sem leite e derivados"]
  ];

  const categoryRules = [
    ["Processos", ["molho", "caldo", "creme", "pure", "sopa", "papa", "batido", "refogado", "cozido", "assado", "grelhado", "ensopado", "gratinado", "ragu", "bolonhesa", "sugo", "vinagrete", "vapor"]],
    ["Proteínas", ["carne", "frango", "peixe", "salmao", "mignon", "patinho", "lagarto", "atum", "ovo", "linguica", "almondega", "roty", "peito", "coxa", "sobrecoxa"]],
    ["Grãos", ["arroz", "feijao", "lentilha", "grao de bico", "macarrao", "massa", "penne", "espaguete", "polenta", "aveia"]],
    ["Verduras", ["alface", "couve", "rucula", "acelga", "escarola", "repolho", "agriao", "almeirao"]],
    ["Legumes", ["batata", "cenoura", "abobrinha", "chuchu", "beterraba", "abobora", "pepino", "palmito", "rabanete", "vagem", "berinjela", "brocolis", "mandioca", "mandioquinha", "tomate"]],
    ["Sobremesas", ["sobremesa", "gelatina", "mousse", "pudim", "doce", "compota", "brigadeiro", "canjica", "arroz doce"]],
    ["Frutas", ["fruta", "pera", "maca", "banana", "mamao", "melancia", "manga", "laranja", "abacaxi", "morango", "uva"]],
    ["Preparações", []]
  ];

  const processTerms = categoryRules.find(([category]) => category === "Processos")[1];

  const canonicalFoodRules = [
    ["Arroz", "Grãos", ["arroz"]],
    ["Feijão", "Grãos", ["feijao"]],
    ["Lentilha", "Grãos", ["lentilha"]],
    ["Grão-de-bico", "Grãos", ["grao de bico"]],
    ["Macarrão", "Grãos", ["macarrao", "massa", "penne", "espaguete"]],
    ["Batata", "Legumes", ["batata"]],
    ["Cenoura", "Legumes", ["cenoura"]],
    ["Abobrinha", "Legumes", ["abobrinha"]],
    ["Abóbora", "Legumes", ["abobora"]],
    ["Chuchu", "Legumes", ["chuchu"]],
    ["Beterraba", "Legumes", ["beterraba"]],
    ["Vagem", "Legumes", ["vagem"]],
    ["Brócolis", "Legumes", ["brocolis"]],
    ["Alface", "Verduras", ["alface"]],
    ["Acelga", "Verduras", ["acelga"]],
    ["Couve", "Verduras", ["couve"]],
    ["Escarola", "Verduras", ["escarola"]],
    ["Tomate", "Legumes", ["tomate"]],
    ["Frango", "Proteínas", ["frango"]],
    ["Carne", "Proteínas", ["carne", "mignon", "patinho", "lagarto", "roty"]],
    ["Peixe", "Proteínas", ["peixe", "salmao", "tilapia", "pescada"]],
    ["Ovo", "Proteínas", ["ovo"]],
    ["Banana", "Frutas", ["banana"]],
    ["Maçã", "Frutas", ["maca"]],
    ["Pera", "Frutas", ["pera"]],
    ["Mamão", "Frutas", ["mamao"]],
    ["Manga", "Frutas", ["manga"]],
    ["Melancia", "Frutas", ["melancia"]],
    ["Abacaxi", "Frutas", ["abacaxi"]]
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

  const prefixedCategories = [
    ["entrada fria", "Entrada fria", "Saladas"],
    ["entrada", "Entrada", "Saladas"],
    ["sobremesa", "Sobremesa", "Sobremesas"],
    ["fruta", "Fruta", "Frutas"],
    ["doce", "Doce", "Sobremesas"],
    ["producao diaria", "Produção diária", "Processos"],
    ["molho", "Molho", "Processos"],
    ["opcoes de escolha", "Opções de escolha", "Opções"],
    ["opcao de escolha", "Opções de escolha", "Opções"],
    ["sem leite", "Sem leite", "Dietas"],
    ["geral dm", "Geral DM", "Dietas"]
  ];

  function emptyImport(rawWorkbook) {
    return {
      fileName: rawWorkbook.fileName,
      importedAt: rawWorkbook.importedAt,
      sheetCount: rawWorkbook.sheetCount,
      menuSheets: [],
      ignoredSheets: [],
      cardapios: [],
      alimentos: new Map(),
      preparacoes: new Map(),
      processos: new Map(),
      dietas: new Map(),
      warnings: [],
      parserVersion: "structured-v6"
    };
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

  function formatDateParts(parts, includeYear = false) {
    if (!parts || !parts.day || !parts.month) return "";
    const day = String(parts.day).padStart(2, "0");
    const month = String(parts.month).padStart(2, "0");
    return includeYear && parts.year ? `${day}/${month}/${parts.year}` : `${day}/${month}`;
  }

  function parseSheetPeriod(sheetName) {
    const normalized = core.normalizeText(sheetName);
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
    const normalized = core.normalizeText(row.text);
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

  function detectSuggestion(normalizedText) {
    const suggestion = normalizedText.match(/^(sugestao|sug|opcao|alternativa)\s*(\d+)/);
    if (suggestion) return `Sugestão ${suggestion[2]}`;
    return "";
  }

  function getPrefixedCategory(text) {
    const normalized = core.normalizeText(text);
    const match = prefixedCategories.find(([prefix]) => normalized.startsWith(`${prefix}:`) || normalized.startsWith(`${prefix} `));
    if (!match) return null;

    const colonIndex = String(text).indexOf(":");
    return {
      title: match[1],
      category: match[2],
      itemText: colonIndex >= 0 ? core.cleanItemText(String(text).slice(colonIndex + 1)) : ""
    };
  }

  function looksLikeDietHeader(text) {
    const normalized = core.normalizeText(text);
    if (!normalized || normalized.length > 180) return false;
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
    return core.titleCase(String(text || "").replace(/\s+/g, " ").trim());
  }

  function isIgnorableCandidate(text) {
    const normalized = core.normalizeText(text);
    if (normalized.length < 3 || normalized.length > 700) return true;
    if (/^\d+([.,]\d+)?$/.test(normalized)) return true;
    if (/^\d{1,2}[:h]\d{0,2}$/.test(normalized)) return true;
    if (/^\d{1,2}[./-]\d{1,2}([./-]\d{2,4})?$/.test(normalized)) return true;
    if (controlPatterns.some((pattern) => pattern.test(normalized))) return true;
    if (normalized.includes("cardapio") || normalized.includes("nutrimenu")) return true;
    if (/^(hs|dbtm|com sal|sem sal|sem tempero|sem acucar simples|tudo 1\/2 porcao|1\/2 porcao|na gota)$/.test(normalized)) return true;
    return false;
  }

  function classifyText(text, explicitCategory = "") {
    if (explicitCategory) return explicitCategory;
    const normalized = core.normalizeText(text);
    if (isProcessName(normalized)) return "Processos";

    const match = categoryRules
      .filter(([category]) => category !== "Processos")
      .find(([, terms]) => terms.some((term) => normalized.includes(term)));
    return match ? match[0] : "Preparações";
  }

  function isProcessName(normalizedText) {
    const words = normalizedText.split(/\s+/).filter(Boolean).length;
    if (/^(molho|caldo|creme|base|sopa|papa|pure|vinagrete)\b/.test(normalizedText)) return true;
    if (words <= 5 && /\b(bolonhesa|sugo|bechamel|madeira|branco)\b/.test(normalizedText)) return true;
    return false;
  }

  function isProcess(normalizedText) {
    return isProcessName(normalizedText);
  }

  function extractDiets(normalizedText, dietMap, source) {
    dietTerms.forEach(([term, label]) => {
      if (normalizedText.includes(term)) core.addRecord(dietMap, label, { source });
    });
  }

  function normalizePreparationName(item) {
    return core.titleCase(String(item || "")
      .replace(/\s+,/g, ",")
      .replace(/,\s*/g, ", ")
      .replace(/\s+/g, " ")
      .trim());
  }

  function stripOuterParentheses(text) {
    let clean = String(text || "").trim();
    while (clean.startsWith("(") && clean.endsWith(")")) {
      const inner = clean.slice(1, -1).trim();
      if (!inner) break;
      clean = inner;
    }
    return clean;
  }

  function splitComponentCandidates(item) {
    const clean = stripOuterParentheses(item);
    const pieces = core.splitDishComponents(clean);
    return pieces.length ? pieces : [clean];
  }

  function buildComponents(item, explicitCategory) {
    const pieces = splitComponentCandidates(item);
    const candidates = pieces.length ? pieces : [item];
    const keys = new Set();
    const components = [];

    candidates.forEach((candidate) => {
      const clean = normalizePreparationName(stripOuterParentheses(candidate));
      const key = core.normalizeText(clean);
      if (!key || keys.has(key) || isIgnorableCandidate(clean)) return;
      keys.add(key);
      components.push({
        name: clean,
        key,
        category: classifyText(clean, explicitCategory)
      });
    });

    return components;
  }

  function isLikelyAtomicFood(component) {
    if (!component || !component.name) return false;
    if (!["Grãos", "Legumes", "Verduras", "Proteínas", "Frutas", "Laticínios"].includes(component.category)) return false;

    const normalized = core.normalizeText(component.name);
    const words = normalized.split(/\s+/).filter(Boolean).length;
    if (words > 5) return false;
    if (/[(),]/.test(component.name)) return false;
    if (/\b(com|ao|aos|a|de)\b/.test(normalized) && words > 3) return false;
    if (processTerms.some((term) => normalized.includes(term)) && words > 2) return false;
    return true;
  }

  function addCanonicalFoodMatches(text, foodMap, source) {
    const normalized = core.normalizeText(text);
    let matched = false;
    canonicalFoodRules.forEach(([name, category, terms]) => {
      if (terms.some((term) => normalized.includes(term))) {
        core.addRecord(foodMap, name, { category, source });
        matched = true;
      }
    });
    return matched;
  }

  function addSectionItem(sectionMap, category, item) {
    const section = sectionMap.get(category) || { title: category, items: [], keys: new Set() };
    core.addUnique(section.items, section.keys, item);
    sectionMap.set(category, section);
  }

  function getCellRanges(cells, maxColumn) {
    return cells
      .slice()
      .sort((a, b) => a.startCol - b.startCol || a.colNumber - b.colNumber)
      .map((cell, index, sorted) => {
        const nextStart = sorted[index + 1] ? sorted[index + 1].startCol - 1 : maxColumn;
        const explicitEnd = cell.endCol || cell.startCol || cell.colNumber;
        const isMergedRange = explicitEnd > (cell.startCol || cell.colNumber);
        return {
          ...cell,
          startCol: cell.startCol || cell.colNumber,
          // Uma mesclagem ja define o limite real do bloco.
          endCol: isMergedRange ? explicitEnd : Math.max(explicitEnd, nextStart || explicitEnd)
        };
      });
  }

  function applyColumnRange(map, startCol, endCol, value) {
    const safeEnd = Math.min(Math.max(endCol || startCol, startCol), 120);
    for (let col = startCol; col <= safeEnd; col += 1) {
      map.set(col, value);
    }
  }

  function createColumnContext(title, startCol, endCol) {
    const cleanTitle = title || "Cardápio geral";
    return {
      title: cleanTitle,
      startCol: startCol || 1,
      endCol: endCol || startCol || 1,
      id: `${core.normalizeText(cleanTitle)}-${startCol || 1}-${endCol || startCol || 1}`
    };
  }

  function getColumnContext(map, col, fallbackTitle, startCol, endCol) {
    return map.get(col) || createColumnContext(fallbackTitle, startCol, endCol);
  }

  function groupKey(groupContext) {
    return groupContext.id;
  }

  function suggestionKey(groupContext, suggestionContext) {
    return `${groupContext.id}-${suggestionContext.id}`;
  }

  function finalizeSectionMap(sectionMap) {
    return Array.from(sectionMap.values()).map((section) => ({
      title: section.title,
      items: section.items
    }));
  }

  function isSuggestionTitle(title) {
    return /^sugestao\s+\d+$/i.test(core.normalizeText(title));
  }

  function mergeCommonSections(entries) {
    const sections = new Map();
    entries.forEach((entry) => {
      (entry.sections || []).forEach((section) => {
        const current = sections.get(section.title) || { title: section.title, items: [], keys: new Set() };
        (section.items || []).forEach((item) => core.addUnique(current.items, current.keys, item));
        sections.set(section.title, current);
      });
    });
    return finalizeSectionMap(sections);
  }

  function addToMasterMaps(imported, clean, components, category, source) {
    const key = core.normalizeText(clean);
    core.addRecord(imported.preparacoes, clean, { category, source });
    extractDiets(key, imported.dietas, source);
    if (isProcess(key) || category === "Processos") core.addRecord(imported.processos, clean, { category: "Processos", source });
    addCanonicalFoodMatches(clean, imported.alimentos, source);

    components.forEach((component) => {
      const normalized = component.key;
      extractDiets(normalized, imported.dietas, source);
      if (component.category === "Processos") {
        core.addRecord(imported.processos, component.name, { category: "Processos", source });
      }
      const hasCanonicalFood = addCanonicalFoodMatches(component.name, imported.alimentos, source);
      if (!hasCanonicalFood && isLikelyAtomicFood(component)) {
        core.addRecord(imported.alimentos, component.name, { category: component.category, source });
      }
    });
  }

  function parseMenuBlock(header, blockRows, sheetName, imported) {
    const groups = new Map();
    const flatSections = new Map();
    const groupByColumn = new Map();
    const suggestionByColumn = new Map();
    const allColumns = blockRows.flatMap((row) => row.cells.map((cell) => cell.endCol || cell.colNumber));
    const maxColumn = Math.max(...allColumns, 20);
    const source = `${sheetName} / ${header.mealTitle}${header.cardNumber ? ` ${header.cardNumber}` : ""}`;

    function getGroup(groupContext) {
      const groupId = groupKey(groupContext);
      const group = groups.get(groupId) || {
        title: groupContext.title,
        startCol: groupContext.startCol,
        endCol: groupContext.endCol,
        suggestions: new Map()
      };
      groups.set(groupId, group);
      return group;
    }

    function getSuggestion(group, groupContext, suggestionContext) {
      const itemSuggestionKey = suggestionKey(groupContext, suggestionContext);
      const suggestion = group.suggestions.get(itemSuggestionKey) || {
        title: suggestionContext.title,
        startCol: suggestionContext.startCol,
        endCol: suggestionContext.endCol,
        sections: new Map(),
        dishes: [],
        dishKeys: new Set(),
        itemCount: 0
      };
      group.suggestions.set(itemSuggestionKey, suggestion);
      return suggestion;
    }

    function addFlatSection(category, item) {
      const section = flatSections.get(category) || { title: category, items: [], keys: new Set() };
      core.addUnique(section.items, section.keys, item);
      flatSections.set(category, section);
    }

    function addDish(groupContext, suggestionContext, item, explicitCategory) {
      const clean = normalizePreparationName(item);
      const key = core.normalizeText(clean);
      if (!key || isIgnorableCandidate(clean)) return;

      const category = classifyText(clean, explicitCategory);
      const components = buildComponents(clean, explicitCategory);
      const visibleComponents = components.length ? components : [{ name: clean, key, category }];
      const group = getGroup(groupContext);
      const suggestion = getSuggestion(group, groupContext, suggestionContext);

      if (!suggestion.dishKeys.has(key)) {
        const dishSections = new Map();
        visibleComponents.forEach((component) => {
          addSectionItem(suggestion.sections, component.category, component.name);
          addSectionItem(dishSections, component.category, component.name);
          addFlatSection(component.category, component.name);
        });

        suggestion.dishes.push({
          name: clean,
          components: visibleComponents,
          sections: finalizeSectionMap(dishSections)
        });
        suggestion.dishKeys.add(key);
        suggestion.itemCount += Math.max(visibleComponents.length, 1);
      }

      addToMasterMaps(imported, clean, visibleComponents, category, source);
      groups.set(groupKey(groupContext), group);
    }

    blockRows.forEach((row) => {
      const ranges = getCellRanges(row.cells, maxColumn);

      ranges.forEach((cell) => {
        core.splitCellSegments(cell.text).forEach((segment) => {
          const normalized = core.normalizeText(segment);
          const suggestion = detectSuggestion(normalized);
          if (suggestion) {
            applyColumnRange(suggestionByColumn, cell.startCol, cell.endCol, createColumnContext(suggestion, cell.startCol, cell.endCol));
          }

          if (looksLikeDietHeader(segment)) {
            const sectionTitle = normalizeSectionTitle(segment);
            applyColumnRange(groupByColumn, cell.startCol, cell.endCol, createColumnContext(sectionTitle, cell.startCol, cell.endCol));
            applyColumnRange(suggestionByColumn, cell.startCol, cell.endCol, createColumnContext("Itens gerais", cell.startCol, cell.endCol));
            extractDiets(normalized, imported.dietas, source);
          }
        });
      });

      ranges.forEach((cell) => {
        const groupContext = getColumnContext(groupByColumn, cell.colNumber, "Cardápio geral", cell.startCol, cell.endCol);
        const suggestionContext = getColumnContext(suggestionByColumn, cell.colNumber, "Itens gerais", cell.startCol, cell.endCol);

        core.splitCellSegments(cell.text).forEach((segment) => {
          const normalized = core.normalizeText(segment);
          if (detectSuggestion(normalized)) return;
          if (looksLikeDietHeader(segment)) {
            applyColumnRange(groupByColumn, cell.startCol, cell.endCol, createColumnContext(normalizeSectionTitle(segment), cell.startCol, cell.endCol));
            applyColumnRange(suggestionByColumn, cell.startCol, cell.endCol, createColumnContext("Itens gerais", cell.startCol, cell.endCol));
            extractDiets(normalized, imported.dietas, source);
            return;
          }

          const prefixed = getPrefixedCategory(segment);
          const itemText = prefixed && prefixed.itemText ? prefixed.itemText : segment;
          if (isIgnorableCandidate(segment) && !prefixed) return;
          if (isIgnorableCandidate(itemText)) return;
          const itemSuggestionContext = prefixed
            ? createColumnContext(prefixed.title, cell.startCol, cell.endCol)
            : suggestionContext;
          addDish(groupContext, itemSuggestionContext, itemText, prefixed ? prefixed.category : "");
        });
      });
    });

    const normalizedGroups = Array.from(groups.values()).map((group) => {
      const entries = Array.from(group.suggestions.values()).map((suggestion) => ({
        title: suggestion.title,
        itemCount: suggestion.itemCount,
        dishes: suggestion.dishes.map((dish) => ({
          name: dish.name,
          components: dish.components,
          sections: dish.sections
        })),
        sections: finalizeSectionMap(suggestion.sections)
      }));
      const commonEntries = entries.filter((entry) => !isSuggestionTitle(entry.title));
      const suggestions = entries.filter((entry) => isSuggestionTitle(entry.title));

      return {
        title: group.title,
        commonSections: mergeCommonSections(commonEntries),
        suggestions,
        itemCount: entries.reduce((total, entry) => total + entry.itemCount, 0)
      };
    }).filter((group) => group.commonSections.length || group.suggestions.length);

    const normalizedSections = finalizeSectionMap(flatSections);
    const itemCount = normalizedGroups.reduce(
      (total, group) => total + group.itemCount,
      0
    );

    return {
      key: core.normalizeText(`${sheetName}-${header.rowNumber}-${header.cardNumber || "sem-numero"}-${header.mealKey}-${header.date || ""}`),
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

  function parseWorksheet(sheet, imported) {
    const rows = sheet.rows;
    const sheetPeriod = parseSheetPeriod(sheet.name);
    const headers = rows.map(parseHeader).filter(Boolean).map((header) => {
      const inferredDate = header.dateParts || inferDateFromSheet(header, sheetPeriod);
      const dateParts = inferredDate && sheetPeriod.year && !inferredDate.year && inferredDate.month === sheetPeriod.month
        ? { ...inferredDate, year: sheetPeriod.year }
        : inferredDate;

      return {
        ...header,
        sheetIndex: sheet.id,
        dateParts,
        date: formatDateParts(dateParts, Boolean(dateParts && dateParts.year))
      };
    });

    if (!headers.length) {
      imported.ignoredSheets.push(sheet.name);
      return;
    }

    imported.menuSheets.push(sheet.name);

    headers.forEach((header, index) => {
      const nextHeader = headers[index + 1];
      const blockRows = rows.filter((row) => row.number > header.rowNumber && (!nextHeader || row.number < nextHeader.rowNumber));
      const menu = parseMenuBlock(header, blockRows, sheet.name, imported);
      imported.cardapios.push(menu);
    });
  }

  function buildDayIndex(cardapios) {
    const days = new Map();

    cardapios.forEach((menu, index) => {
      const dateText = menu.date || "";
      const fallbackLabel = menu.cardNumber ? `Cardápio ${menu.cardNumber}` : `Bloco ${index + 1}`;
      const key = core.normalizeText(`${menu.sheetName}-${dateText || fallbackLabel}-${menu.cardNumber || index}`);
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

  function parseWorkbookData(rawWorkbook) {
    const imported = emptyImport(rawWorkbook);
    rawWorkbook.sheets.forEach((sheet) => parseWorksheet(sheet, imported));
    imported.days = buildDayIndex(imported.cardapios);
    imported.periodLabel = buildPeriodLabel(imported.days);
    imported.periods = buildSheetPeriodDescriptions(imported.days);

    return {
      ...imported,
      alimentos: Array.from(imported.alimentos.values()),
      preparacoes: Array.from(imported.preparacoes.values()),
      processos: Array.from(imported.processos.values()),
      dietas: Array.from(imported.dietas.values())
    };
  }

  window.NutriMenuParser = {
    parseWorkbookData,
    parseMenuBlock
  };
})(window);
