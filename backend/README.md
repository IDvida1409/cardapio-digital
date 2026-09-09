# NutriMenu AI API

Backend para importar cardápios hospitalares a partir de Excel sem expor chave de IA no navegador.

## Fluxo

1. Recebe `.xlsx` em `POST /api/import-cardapio`.
2. Lê todas as células úteis, incluindo posição e mesclagens.
3. Envia a estrutura bruta para o Gemini quando `GEMINI_API_KEY` está configurada.
4. Valida se toda célula útil foi marcada como usada, ignorada ou pendente.
5. Grava a importação, auditoria de células e cardápio no banco quando a confiança for suficiente.

## Variáveis

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite
DATABASE_URL=
SQLITE_PATH=./nutrimenu.db
ALLOWED_ORIGINS=https://nutrimenu-cardapio-digital.onrender.com
```

Sem `DATABASE_URL`, o backend usa SQLite local. No Render, use Postgres.

## Rodar local

```bash
python app.py
```

Teste:

```bash
curl http://localhost:8000/health
```
