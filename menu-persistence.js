(function attachNutriMenuPersistence(window) {
  const core = window.NutriMenuCore;

  function emptyBase() {
    return {
      alimentos: [],
      preparacoes: [],
      processos: [],
      dietas: [],
      cardapios: []
    };
  }

  function mergeCollection(masterBase, collectionName, records) {
    const existing = new Map((masterBase[collectionName] || []).map((record) => [record.key, record]));
    let created = 0;

    records.forEach((record) => {
      const key = record.key || core.normalizeText(record.name || record.title);
      if (!key) return;

      const sources = Array.isArray(record.sources) ? record.sources : [];
      if (!existing.has(key)) {
        existing.set(key, { ...record, key, sources });
        created += 1;
        return;
      }

      const current = existing.get(key);
      current.count = (current.count || 0) + (record.count || 1);
      current.sources = Array.isArray(current.sources) ? current.sources : [];
      sources.forEach((source) => {
        if (!current.sources.includes(source)) current.sources.push(source);
      });
      if (record.category && !current.category) current.category = record.category;
    });

    masterBase[collectionName] = Array.from(existing.values()).sort((a, b) => {
      const left = a.name || a.title || a.key;
      const right = b.name || b.title || b.key;
      return left.localeCompare(right, "pt-BR");
    });

    return created;
  }

  function mergeImportedData(masterBase, imported) {
    const nextBase = {
      ...emptyBase(),
      ...masterBase
    };

    const created = {
      alimentos: mergeCollection(nextBase, "alimentos", imported.alimentos || []),
      preparacoes: mergeCollection(nextBase, "preparacoes", imported.preparacoes || []),
      processos: mergeCollection(nextBase, "processos", imported.processos || []),
      dietas: mergeCollection(nextBase, "dietas", imported.dietas || []),
      cardapios: mergeCollection(nextBase, "cardapios", imported.cardapios || [])
    };

    return {
      masterBase: nextBase,
      created
    };
  }

  window.NutriMenuPersistence = {
    emptyBase,
    mergeImportedData
  };
})(window);
