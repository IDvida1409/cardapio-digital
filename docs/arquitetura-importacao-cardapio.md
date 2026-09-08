# Arquitetura de importação de cardápios hospitalares

## Objetivo

Transformar uma planilha `.xlsx` em uma base estruturada de cardápio digital. O Excel é apenas entrada; depois da importação, a fonte oficial deve ser o banco do sistema.

## Camadas

1. **Leitura**
   - Recebe o arquivo `.xlsx`.
   - Usa ExcelJS para extrair abas, linhas, colunas, textos e células mescladas.
   - Não interpreta regra de negócio nesta etapa.

2. **Interpretação**
   - Identifica início e fim de cada bloco de cardápio.
   - Extrai período, dia, refeição, dieta, sugestão, preparação, componentes, sobremesas, entradas e observações.
   - Não depende de coordenadas fixas; usa cabeçalhos, palavras-chave e posição relativa.

3. **Normalização**
   - Remove acentos para gerar chaves de comparação.
   - Padroniza caixa, espaços e pontuação.
   - Evita duplicidade entre variações como `ARROZ BRANCO`, `Arroz branco` e `arroz  branco`.

4. **Validação**
   - Confirma se a estrutura extraída tem dias, refeições, sugestões e itens.
   - Gera avisos quando algo fica incompleto ou ambíguo.
   - No backend final, esta camada deve usar schemas tipados, como Zod.

5. **Persistência**
   - Consulta a base mestre antes de cadastrar.
   - Reutiliza categorias, alimentos, preparações, processos e dietas existentes.
   - Cadastra somente registros novos.
   - Deve ser transacional no backend final.

## Modelo de dados alvo

- `categorias`
- `alimentos`
- `preparacoes`
- `processos`
- `dietas`
- `cardapios`
- `cardapio_dias`
- `cardapio_refeicoes`
- `cardapio_grupos_dieta`
- `cardapio_sugestoes`
- `cardapio_itens`

## Estado atual do protótipo

O protótipo publicado ainda é um site estático. A importação roda no navegador e a base mestre fica no `localStorage`.

Nesta etapa, a extração foi separada em módulos:

- `normalizer.js`
- `menu-reader.js`
- `menu-parser.js`
- `menu-validator.js`
- `menu-persistence.js`
- `menu-importer.js`

Isso melhora a interpretação da planilha e prepara a migração para backend, mas não substitui banco de dados real.

## Próxima etapa obrigatória

Migrar a importação para backend Node/TypeScript no Render e conectar PostgreSQL. O navegador deve apenas enviar o arquivo e mostrar a revisão da importação.
