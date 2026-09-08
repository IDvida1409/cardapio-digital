(function attachNutriMenuCore(window) {
  const keepLower = new Set(["a", "as", "o", "os", "de", "da", "das", "do", "dos", "e", "ao", "à", "com", "sem"]);

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

  function cleanItemText(text) {
    return String(text || "")
      .replace(/^[\s\-–—:]+/, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cellToText(value) {
    if (value === null || value === undefined) return "";
    if (value instanceof Date) return value.toLocaleDateString("pt-BR");
    if (typeof value === "object") {
      if (Array.isArray(value.richText)) return value.richText.map((part) => part.text || "").join("");
      if (value.text) return String(value.text);
      if (value.hyperlink && value.text) return String(value.text);
      if (value.result !== undefined) return cellToText(value.result);
      if (value.formula) return "";
      return "";
    }
    return String(value);
  }

  function columnLettersToNumber(letters) {
    return String(letters || "")
      .toUpperCase()
      .split("")
      .reduce((total, letter) => (total * 26) + letter.charCodeAt(0) - 64, 0);
  }

  function parseCellAddress(address) {
    const match = String(address || "").match(/^([A-Z]+)(\d+)$/i);
    if (!match) return null;
    return {
      col: columnLettersToNumber(match[1]),
      row: Number(match[2])
    };
  }

  function parseCellRangeAddress(range) {
    const parts = String(range || "").split(":");
    const start = parseCellAddress(parts[0]);
    const end = parseCellAddress(parts[1] || parts[0]);
    if (!start || !end) return null;
    return {
      startRow: Math.min(start.row, end.row),
      endRow: Math.max(start.row, end.row),
      startCol: Math.min(start.col, end.col),
      endCol: Math.max(start.col, end.col)
    };
  }

  function splitOutsideDelimiters(text, delimiters) {
    const delimiterSet = new Set(delimiters);
    const input = String(text || "")
      .replace(/\r\n/g, "\n")
      .replace(/[•▪●]/g, "\n");
    const parts = [];
    let buffer = "";
    let depth = 0;

    for (const char of input) {
      if (char === "(") depth += 1;
      if (char === ")" && depth > 0) depth -= 1;

      if (depth === 0 && delimiterSet.has(char)) {
        const clean = cleanItemText(buffer);
        if (clean) parts.push(clean);
        buffer = "";
        continue;
      }

      buffer += char;
    }

    const clean = cleanItemText(buffer);
    if (clean) parts.push(clean);
    return parts;
  }

  function splitCellSegments(text) {
    return splitOutsideDelimiters(text, ["\n", ";"]);
  }

  function splitDishComponents(text) {
    return splitOutsideDelimiters(text, [",", "\n", ";"])
      .map((part) => part.replace(/\s+\/\s+$/g, "").trim())
      .filter(Boolean);
  }

  function addUnique(items, keys, value) {
    const key = normalizeText(value);
    if (!key || keys.has(key)) return false;
    items.push(value);
    keys.add(key);
    return true;
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

    current.count += metadata.count || 1;
    if (metadata.source && !current.sources.includes(metadata.source)) current.sources.push(metadata.source);
    if (metadata.category && !current.category) current.category = metadata.category;
    map.set(key, current);
  }

  window.NutriMenuCore = {
    addRecord,
    addUnique,
    cellToText,
    cleanItemText,
    normalizeText,
    parseCellRangeAddress,
    splitCellSegments,
    splitDishComponents,
    titleCase
  };
})(window);
