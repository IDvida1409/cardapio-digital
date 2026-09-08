(function attachNutriMenuImporter(window) {
  async function parseWorkbook(file) {
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
    version: "structured-v2"
  };
})(window);
