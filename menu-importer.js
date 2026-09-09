(function attachNutriMenuImporter(window) {
  const core = window.NutriMenuCore;
  const DEFAULT_API_URL = "https://nutrimenu-ai-api.onrender.com";

  function apiUrl() {
    return String(window.NUTRIMENU_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
  }

  function mealKey(name) {
    const normalized = core.normalizeText(name);
    if (normalized.includes("cafe")) return "cafe";
    if (normalized.includes("jantar")) return "jantar";
    if (normalized.includes("almoco")) return "almoco";
    return normalized || "refeicao";
  }

  function titleCase(value) {
    return core.titleCase(String(value || "").replace(/\s+/g, " ").trim());
  }

  function dateText(value) {
    const text = String(value || "").trim();
    const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    const brMatch = text.match(/^(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?/);
    if (!brMatch) return text;
    const day = brMatch[1].padStart(2, "0");
    const month = brMatch[2].padStart(2, "0");
    return brMatch[3] ? `${day}/${month}/${brMatch[3]}` : `${day}/${month}`;
  }

  function datePartsFromText(value) {
    const text = dateText(value);
    const match = text.match(/^(\d{2})\/(\d{2})(?:\/(\d{2,4}))?/);
    if (!match) return null;
    return {
      day: Number(match[1]),
      month: Number(match[2]),
      year: match[3] ? Number(match[3].length === 2 ? `20${match[3]}` : match[3]) : undefined
    };
  }

  function buildSections(items, title = "Itens do cardápio") {
    const cleanItems = (items || []).map((item) => String(item || "").trim()).filter(Boolean);
    return cleanItems.length ? [{ title, items: cleanItems }] : [];
  }

  function buildSuggestion(suggestion) {
    const items = (suggestion.itens || []).map((item) => String(item || "").trim()).filter(Boolean);
    return {
      title: titleCase(suggestion.titulo || "Sugestão"),
      itemCount: items.length,
      dishes: items.map((item) => ({
        name: item,
        components: [],
        sections: []
      })),
      sections: buildSections(items)
    };
  }

  function buildGroup(menuType) {
    const commonItems = (menuType.itensComuns || []).map((item) => String(item || "").trim()).filter(Boolean);
    const suggestions = (menuType.sugestoes || []).map(buildSuggestion);
    return {
      title: titleCase(menuType.titulo || "Tipo de cardápio"),
      commonSections: buildSections(commonItems),
      suggestions,
      itemCount: commonItems.length + suggestions.reduce((total, suggestion) => total + suggestion.itemCount, 0)
    };
  }

  function adaptAiImport(file, payload) {
    const result = payload.result || {};
    const menus = [];
    const days = [];
    const periods = (result.periodos || []).map((period) => ({
      sheetName: period.titulo || "Período",
      period: [period.inicio, period.fim].filter(Boolean).join(" a ") || period.titulo || "Período",
      label: [period.inicio, period.fim].filter(Boolean).join(" a ") || period.titulo || "Período"
    }));

    (result.dias || []).forEach((day, dayIndex) => {
      const formattedDate = dateText(day.data);
      const parts = datePartsFromText(day.data);
      const key = core.normalizeText(`${formattedDate || "dia"}-${dayIndex}`);
      const dayMeals = {};

      (day.refeicoes || []).forEach((meal) => {
        const keyMeal = mealKey(meal.nome);
        const mealMenus = (meal.cardapios || []).map((card, cardIndex) => {
          const groups = (card.tipos || []).map(buildGroup).filter((group) => group.itemCount);
          const itemCount = groups.reduce((total, group) => total + group.itemCount, 0);
          const menu = {
            key: core.normalizeText(`${key}-${keyMeal}-${cardIndex}-${card.titulo || ""}`),
            name: titleCase(card.titulo || `${meal.nome || "Refeição"} ${cardIndex + 1}`),
            sheetName: "Backend IA",
            sheetIndex: dayIndex + 1,
            rowNumber: cardIndex + 1,
            cardNumber: cardIndex + 1,
            mealKey: keyMeal,
            mealTitle: titleCase(meal.nome || keyMeal),
            date: formattedDate,
            dateParts: parts,
            dayName: titleCase(day.diaSemana || ""),
            title: titleCase(card.titulo || `${meal.nome || "Refeição"} ${cardIndex + 1}`),
            category: "Cardápios",
            count: 1,
            sources: card.sourceRefs || [],
            itemCount,
            groups,
            sections: []
          };
          menus.push(menu);
          return menu;
        });
        dayMeals[keyMeal] = mealMenus;
      });

      days.push({
        key,
        dateText: formattedDate,
        dayName: titleCase(day.diaSemana || ""),
        cardNumber: dayIndex + 1,
        sheetName: "Backend IA",
        sheetIndex: dayIndex + 1,
        sort: parts ? Number(`${parts.year || 0}${String(parts.month).padStart(2, "0")}${String(parts.day).padStart(2, "0")}`) : dayIndex,
        meals: dayMeals,
        title: titleCase(day.diaSemana || (formattedDate ? `Dia ${formattedDate.split("/")[0]}` : `Dia ${dayIndex + 1}`)),
        subtitle: formattedDate || `Dia ${dayIndex + 1}`,
        mealCount: Object.values(dayMeals).reduce((total, mealMenus) => total + mealMenus.length, 0)
      });
    });

    const validation = payload.validation || {};
    const pending = Number(validation.pendingCells || 0);
    const warnings = [
      payload.status === "persisted"
        ? "Importação validada e persistida no backend."
        : "Importação interpretada, mas ainda não persistida como oficial por baixa confiança ou células pendentes.",
      `${validation.totalUsefulCells || 0} célula(s) úteis lidas; ${pending} pendente(s).`
    ];

    return {
      fileName: file.name,
      importedAt: new Date().toISOString(),
      source: "backend-ai",
      serverImport: true,
      importId: payload.importId,
      status: payload.status,
      validation,
      warnings,
      menuSheets: ["Backend IA"],
      ignoredSheets: [],
      cardapios: menus,
      days,
      periods,
      periodLabel: periods.length
        ? `${periods.length} período(s) identificado(s)`
        : `${days.length} dia(s) importado(s)`,
      alimentos: [],
      preparacoes: [],
      processos: [],
      dietas: []
    };
  }

  async function parseWorkbookWithBackend(file) {
    const form = new FormData();
    form.append("file", file);

    const response = await fetch(`${apiUrl()}/api/import-cardapio?includeResult=1`, {
      method: "POST",
      body: form
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Backend não conseguiu interpretar a planilha.");
    }
    if (!payload.result) {
      throw new Error("Backend respondeu sem a estrutura do cardápio.");
    }
    return adaptAiImport(file, payload);
  }

  async function parseWorkbook(file) {
    if (window.NUTRIMENU_USE_LOCAL_IMPORTER !== true) {
      return parseWorkbookWithBackend(file);
    }

    const rawWorkbook = await window.NutriMenuExcelReader.readWorkbook(file);
    const imported = window.NutriMenuParser.parseWorkbookData(rawWorkbook);
    const validation = window.NutriMenuValidator.validateImportedMenu(imported);

    imported.validation = validation;
    imported.warnings = [
      ...(imported.warnings || []),
      ...validation.warnings,
      ...validation.errors
    ];

    return imported;
  }

  window.NutriMenuImporter = {
    parseWorkbook,
    parseWorkbookWithBackend,
    version: "backend-ai-v1"
  };
})(window);
