# NutriMenu | Cardápio Digital

Protótipo separado para o módulo de cardápio hospitalar.

## Estado atual

- Base inicial de categorias.
- Tela de prévia do cardápio em visual inspirado na referência enviada.
- Leitura de Excel no protótipo estático.
- Backend separado em `backend/` para teste com Gemini e persistência.
- Blueprint do Render preparado com frontend estático e API Python.
- Banco externo/existente deve ser conectado por `DATABASE_URL`.

## Próximas etapas

1. Criar o serviço `nutrimenu-ai-api` no Render pelo Blueprint.
2. Adicionar `GEMINI_API_KEY` no ambiente do backend.
3. Conectar o frontend ao endpoint `POST /api/import-cardapio`.
4. Usar o banco existente do Render pela variável `DATABASE_URL`.
5. Permitir montagem manual de cardápios usando a base mestre.
