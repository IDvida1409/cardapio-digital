(function attachNutriMenuValidator(window) {
  function validateImportedMenu(imported) {
    const warnings = [];
    const errors = [];

    if (!imported.cardapios.length) {
      errors.push("Nenhum bloco de cardápio foi reconhecido.");
    }

    const menusWithoutDate = imported.cardapios.filter((menu) => !menu.date && !menu.cardNumber).length;
    if (menusWithoutDate) {
      warnings.push(`${menusWithoutDate} cardápio(s) não têm data explícita no cabeçalho.`);
    }

    const emptyMenus = imported.cardapios.filter((menu) => !menu.groups.length || !menu.itemCount).length;
    if (emptyMenus) {
      warnings.push(`${emptyMenus} cardápio(s) foram identificados, mas não tiveram itens separados.`);
    }

    const hasCafe = imported.cardapios.some((menu) => menu.mealKey === "cafe");
    if (!hasCafe) {
      warnings.push("Café da manhã não apareceu como bloco de cardápio nesta planilha.");
    }

    if (imported.ignoredSheets.length) {
      warnings.push(`${imported.ignoredSheets.length} aba(s) não parecem ser cardápio.`);
    }

    const suggestionCount = imported.cardapios.reduce((total, menu) => (
      total + menu.groups.reduce((groupTotal, group) => groupTotal + group.suggestions.length, 0)
    ), 0);

    const dishCount = imported.cardapios.reduce((total, menu) => (
      total + menu.groups.reduce((groupTotal, group) => (
        groupTotal + group.suggestions.reduce((suggestionTotal, suggestion) => suggestionTotal + (suggestion.dishes || []).length, 0)
      ), 0)
    ), 0);

    if (!suggestionCount && imported.cardapios.length) {
      warnings.push("Nenhuma sugestão numerada foi encontrada dentro dos cardápios.");
    }

    return {
      status: errors.length ? "error" : warnings.length ? "warning" : "ok",
      errors,
      warnings,
      metrics: {
        dias: imported.days.length,
        refeicoes: imported.cardapios.length,
        sugestoes: suggestionCount,
        preparacoes: dishCount,
        componentes: imported.cardapios.reduce((total, menu) => total + (menu.itemCount || 0), 0)
      }
    };
  }

  window.NutriMenuValidator = {
    validateImportedMenu
  };
})(window);
