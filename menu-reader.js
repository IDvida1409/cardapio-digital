(function attachNutriMenuExcelReader(window) {
  const core = window.NutriMenuCore;

  function collectMergeRanges(worksheet) {
    const ranges = [];
    const modelMerges = worksheet.model && Array.isArray(worksheet.model.merges) ? worksheet.model.merges : [];

    modelMerges.forEach((range) => {
      const parsed = core.parseCellRangeAddress(range);
      if (parsed) ranges.push(parsed);
    });

    const privateMerges = worksheet._merges ? Object.values(worksheet._merges) : [];
    privateMerges.forEach((merge) => {
      const range = merge && (merge.range || merge.model);
      const address = typeof range === "string" ? range : merge && merge.tl && merge.br ? `${merge.tl}:${merge.br}` : "";
      const parsed = core.parseCellRangeAddress(address);
      if (parsed && !ranges.some((current) => sameRange(current, parsed))) ranges.push(parsed);
    });

    return ranges;
  }

  function sameRange(left, right) {
    return left.startRow === right.startRow
      && left.endRow === right.endRow
      && left.startCol === right.startCol
      && left.endCol === right.endCol;
  }

  function findMergeRange(ranges, rowNumber, colNumber) {
    return ranges.find((range) => (
      rowNumber >= range.startRow
      && rowNumber <= range.endRow
      && colNumber >= range.startCol
      && colNumber <= range.endCol
    )) || null;
  }

  function extractRows(worksheet) {
    const mergeRanges = collectMergeRanges(worksheet);
    const rows = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const cells = [];

      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const text = core.cellToText(cell.value).trim();
        if (!core.normalizeText(text)) return;

        const mergeRange = findMergeRange(mergeRanges, rowNumber, colNumber);
        const isMergedChild = mergeRange && (rowNumber !== mergeRange.startRow || colNumber !== mergeRange.startCol);
        if (isMergedChild) return;
        if (cell.isMerged && cell.master && cell.address !== cell.master.address) return;

        const startCol = mergeRange ? mergeRange.startCol : colNumber;
        const endCol = mergeRange ? mergeRange.endCol : colNumber;
        const key = `${startCol}:${endCol}:${core.normalizeText(text)}`;
        if (cells.some((current) => current.key === key)) return;

        cells.push({
          key,
          address: cell.address,
          rowNumber,
          colNumber,
          startCol,
          endCol,
          text
        });
      });

      if (cells.length) {
        const sortedCells = cells.sort((a, b) => a.startCol - b.startCol || a.colNumber - b.colNumber);
        rows.push({
          number: rowNumber,
          cells: sortedCells,
          text: sortedCells.map((cell) => cell.text).join(" | ")
        });
      }
    });

    return rows;
  }

  async function readWorkbook(file) {
    if (!window.ExcelJS) {
      throw new Error("A biblioteca de leitura do Excel não carregou. Recarregue a página e tente novamente.");
    }

    const workbook = new window.ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());

    const sheets = [];
    workbook.eachSheet((worksheet, sheetId) => {
      sheets.push({
        id: sheetId,
        name: worksheet.name,
        rowCount: worksheet.rowCount,
        columnCount: worksheet.columnCount,
        rows: extractRows(worksheet)
      });
    });

    return {
      fileName: file.name,
      importedAt: new Date().toISOString(),
      sheetCount: workbook.worksheets.length,
      sheets
    };
  }

  window.NutriMenuExcelReader = {
    extractRows,
    readWorkbook
  };
})(window);
