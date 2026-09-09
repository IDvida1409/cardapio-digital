import hashlib
import json
import os
import re
import sqlite3
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from email.parser import BytesParser
from email.policy import default as email_policy
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from urllib import request as urllib_request
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlparse

from openpyxl import load_workbook

try:
    import psycopg
    from psycopg.rows import dict_row
except Exception:  # pragma: no cover - optional outside production
    psycopg = None
    dict_row = None


PARSER_VERSION = "backend-ai-v1"
DEFAULT_MODEL = "gemini-3.5-flash-lite"
MAX_UPLOAD_BYTES = 15 * 1024 * 1024
MAX_BLOCKS_PER_IMPORT = 80
MAX_BLOCKS_PER_AI_BATCH = 6
MAX_PARALLEL_AI_BATCHES = 2
WEEKDAY_LABELS = {
    "segunda": "Segunda-feira",
    "terca": "Terça-feira",
    "quarta": "Quarta-feira",
    "quinta": "Quinta-feira",
    "sexta": "Sexta-feira",
    "sabado": "Sábado",
    "domingo": "Domingo",
}
MEAL_LABELS = {
    "cafe": "Café da Manhã",
    "almoco": "Almoço",
    "jantar": "Jantar",
    "ceia": "Ceia",
    "lanche": "Lanche",
}


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def normalize_text(value):
    import unicodedata

    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    text = text.replace("_", " ").replace("|", " ").lower()
    return " ".join(text.split())


def cell_to_text(value):
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.date().isoformat()
    return str(value).strip()


def merged_range_for(sheet, row_number, col_number):
    for merged in sheet.merged_cells.ranges:
        if (
            merged.min_row <= row_number <= merged.max_row
            and merged.min_col <= col_number <= merged.max_col
        ):
            return merged
    return None


def read_workbook(file_bytes, filename):
    workbook = load_workbook(BytesIO(file_bytes), data_only=True)
    sheets = []
    useful_cells = []

    for sheet_index, sheet in enumerate(workbook.worksheets, start=1):
        rows = []
        for row in sheet.iter_rows():
            cells = []
            for cell in row:
                text = cell_to_text(cell.value)
                if not normalize_text(text):
                    continue

                merged = merged_range_for(sheet, cell.row, cell.column)
                if merged and (cell.row != merged.min_row or cell.column != merged.min_col):
                    continue

                start_col = merged.min_col if merged else cell.column
                end_col = merged.max_col if merged else cell.column
                start_row = merged.min_row if merged else cell.row
                end_row = merged.max_row if merged else cell.row
                record = {
                    "sheet": sheet.title,
                    "sheetIndex": sheet_index,
                    "address": cell.coordinate,
                    "row": cell.row,
                    "column": cell.column,
                    "startRow": start_row,
                    "endRow": end_row,
                    "startColumn": start_col,
                    "endColumn": end_col,
                    "rowSpan": end_row - start_row + 1,
                    "columnSpan": end_col - start_col + 1,
                    "text": text,
                    "normalizedText": normalize_text(text),
                }
                cells.append(record)
                useful_cells.append(record)

            if cells:
                cells.sort(key=lambda item: (item["startColumn"], item["column"]))
                rows.append({"row": row[0].row, "cells": cells})

        sheets.append(
            {
                "name": sheet.title,
                "index": sheet_index,
                "rowCount": sheet.max_row,
                "columnCount": sheet.max_column,
                "rows": rows,
            }
        )

    return {
        "fileName": filename,
        "sha256": hashlib.sha256(file_bytes).hexdigest(),
        "sheetCount": len(sheets),
        "sheets": sheets,
        "usefulCells": useful_cells,
    }


def compact_workbook_for_ai(raw_workbook):
    blocks = []
    for sheet in raw_workbook["sheets"]:
        sheet_cells = []
        for row in sheet["rows"]:
            for cell in row["cells"]:
                sheet_cells.append(
                    {
                        "ref": f"{sheet['index']}!{cell['address']}",
                        "sheet": sheet["name"],
                        "row": cell["row"],
                        "col": cell["column"],
                        "rowSpan": cell["rowSpan"],
                        "colSpan": cell["columnSpan"],
                        "text": cell["text"],
                    }
                )
        blocks.append(
            {
                "sheet": sheet["name"],
                "index": sheet["index"],
                "rowCount": sheet["rowCount"],
                "columnCount": sheet["columnCount"],
                "cells": sheet_cells,
            }
        )
    return blocks


def expected_ai_schema():
    return {
        "type": "object",
        "properties": {
            "periodos": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "titulo": {"type": "string"},
                        "inicio": {"type": "string"},
                        "fim": {"type": "string"},
                    },
                    "required": ["titulo"],
                },
            },
            "dias": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "data": {"type": "string"},
                        "diaSemana": {"type": "string"},
                        "refeicoes": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "nome": {"type": "string"},
                                    "cardapios": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "titulo": {"type": "string"},
                                                "tipos": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "titulo": {"type": "string"},
                                                            "itensComuns": {
                                                                "type": "array",
                                                                "items": {"type": "string"},
                                                            },
                                                            "sugestoes": {
                                                                "type": "array",
                                                                "items": {
                                                                    "type": "object",
                                                                    "properties": {
                                                                        "titulo": {"type": "string"},
                                                                        "itens": {
                                                                            "type": "array",
                                                                            "items": {"type": "string"},
                                                                        },
                                                                    },
                                                                    "required": ["titulo", "itens"],
                                                                },
                                                            },
                                                            "sourceRefs": {
                                                                "type": "array",
                                                                "items": {"type": "string"},
                                                            },
                                                        },
                                                        "required": ["titulo", "itensComuns", "sugestoes", "sourceRefs"],
                                                    },
                                                },
                                                "sourceRefs": {
                                                    "type": "array",
                                                    "items": {"type": "string"},
                                                },
                                            },
                                            "required": ["titulo", "tipos", "sourceRefs"],
                                        },
                                    },
                                },
                                "required": ["nome", "cardapios"],
                            },
                        },
                    },
                    "required": ["data", "refeicoes"],
                },
            },
            "celulasUsadas": {"type": "array", "items": {"type": "string"}},
            "celulasIgnoradas": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "ref": {"type": "string"},
                        "motivo": {"type": "string"},
                    },
                    "required": ["ref", "motivo"],
                },
            },
            "celulasPendentes": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "ref": {"type": "string"},
                        "motivo": {"type": "string"},
                    },
                    "required": ["ref", "motivo"],
                },
            },
            "confianca": {"type": "number"},
        },
        "required": ["dias", "celulasUsadas", "celulasIgnoradas", "celulasPendentes", "confianca"],
    }


def build_ai_prompt(raw_workbook):
    return {
        "instruction": (
            "Analise a grade de Excel como estrutura visual de um cardápio hospitalar. "
            "Não use conhecimento prévio sobre nomes específicos de dietas ou hospitais. "
            "Não invente dados. Preserve a hierarquia visual: cabeçalhos, blocos, subtítulos, sugestões e itens abaixo. "
            "Toda célula com texto útil deve estar em celulasUsadas, celulasIgnoradas com motivo, ou celulasPendentes. "
            "Se uma célula for nota operacional e não parte do cardápio, marque como ignorada com motivo. "
            "Responda somente JSON válido no schema solicitado."
        ),
        "schema": expected_ai_schema(),
        "workbook": {
            "fileName": raw_workbook["fileName"],
            "sha256": raw_workbook["sha256"],
            "sheets": compact_workbook_for_ai(raw_workbook),
        },
    }


def source_ref(cell):
    return f"{cell['sheetIndex']}!{cell['address']}"


def ranges_overlap(left_start, left_end, right_start, right_end):
    return left_start <= right_end and right_start <= left_end


def detect_header_info(text):
    normalized = normalize_text(text)
    if "cardapio" not in normalized and "menu" not in normalized:
        return None

    date_match = re.search(r"\b(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?\b", str(text or ""))
    day_name = next((label for key, label in WEEKDAY_LABELS.items() if key in normalized), "")
    meal_name = next((label for key, label in MEAL_LABELS.items() if key in normalized), "")
    card_match = re.search(r"\b(?:cardapio|menu)\s*(\d+)\b", normalized)

    if not date_match and not day_name and not meal_name:
        return None

    date_text = ""
    if date_match:
        day = date_match.group(1).zfill(2)
        month = date_match.group(2).zfill(2)
        year = date_match.group(3)
        date_text = f"{day}/{month}/{year}" if year else f"{day}/{month}"

    return {
        "title": " ".join(str(text or "").split()),
        "date": date_text,
        "dayName": day_name,
        "mealName": meal_name,
        "cardNumber": card_match.group(1) if card_match else "",
    }


def cells_in_rows(cells):
    rows = {}
    for cell in cells:
        rows.setdefault(cell["row"], {"row": cell["row"], "cells": []})
        rows[cell["row"]]["cells"].append(cell)

    result = []
    for row in sorted(rows.values(), key=lambda item: item["row"]):
        row["cells"].sort(key=lambda cell: (cell["startColumn"], cell["column"]))
        result.append(row)
    return result


def detect_menu_blocks(raw_workbook):
    blocks = []
    for sheet in raw_workbook["sheets"]:
        sheet_cells = [cell for row in sheet["rows"] for cell in row["cells"]]
        headers = []
        for cell in sheet_cells:
            header_info = detect_header_info(cell["text"])
            if header_info:
                headers.append({**cell, "headerInfo": header_info})

        headers.sort(key=lambda cell: (cell["startRow"], cell["startColumn"]))
        if not headers:
            continue

        for index, header in enumerate(headers[:MAX_BLOCKS_PER_IMPORT]):
            next_rows = [
                other["startRow"]
                for other in headers
                if other["startRow"] > header["startRow"]
                and ranges_overlap(header["startColumn"], header["endColumn"], other["startColumn"], other["endColumn"])
            ]
            end_row = min(next_rows) - 1 if next_rows else sheet["rowCount"]
            start_col = header["startColumn"]
            end_col = header["endColumn"] if header["columnSpan"] > 1 else sheet["columnCount"]
            block_cells = [
                cell
                for cell in sheet_cells
                if cell["startRow"] >= header["startRow"]
                and cell["startRow"] <= end_row
                and ranges_overlap(start_col, end_col, cell["startColumn"], cell["endColumn"])
            ]

            if len(block_cells) <= 1:
                continue

            block_name = f"{sheet['name']} / {header['headerInfo']['title']}"
            blocks.append(
                {
                    "header": header,
                    "sourceRefs": {source_ref(cell) for cell in block_cells},
                    "raw": {
                        "fileName": raw_workbook["fileName"],
                        "sha256": raw_workbook["sha256"],
                        "sheetCount": 1,
                        "sheets": [
                            {
                                "name": block_name,
                                "index": sheet["index"],
                                "rowCount": end_row - header["startRow"] + 1,
                                "columnCount": end_col - start_col + 1,
                                "rows": cells_in_rows(block_cells),
                            }
                        ],
                        "usefulCells": block_cells,
                    },
                }
            )
    return blocks


def build_block_prompt(block):
    prompt = build_ai_prompt(block["raw"])
    prompt["instruction"] = (
        "Este payload é um recorte de um único bloco de cardápio hospitalar. "
        "Use o cabeçalho detectado apenas como ponto de partida extraído da própria planilha. "
        "Preserve a hierarquia visual dentro deste bloco: título do cardápio, tipos/subtítulos, itens comuns, sugestões e itens das sugestões. "
        "Não classifique alimentos por categoria clínica nesta etapa; mantenha o texto como aparece no cardápio. "
        "Não invente dados e não use conhecimento prévio sobre hospitais. "
        "Toda célula com texto útil dentro deste recorte deve estar em celulasUsadas, celulasIgnoradas com motivo, ou celulasPendentes."
    )
    prompt["detectedHeader"] = block["header"]["headerInfo"]
    return prompt


def build_batch_raw(raw_workbook, blocks):
    batch_cells = []
    sheets = []
    for index, block in enumerate(blocks, start=1):
        block_sheet = block["raw"]["sheets"][0]
        batch_cells.extend(block["raw"]["usefulCells"])
        sheets.append(
            {
                **block_sheet,
                "index": block_sheet["index"],
                "name": block_sheet["name"],
            }
        )

    return {
        "fileName": raw_workbook["fileName"],
        "sha256": raw_workbook["sha256"],
        "sheetCount": len(sheets),
        "sheets": sheets,
        "usefulCells": batch_cells,
    }


def build_batch_prompt(raw_workbook, blocks):
    batch_raw = build_batch_raw(raw_workbook, blocks)
    prompt = build_ai_prompt(batch_raw)
    prompt["instruction"] = (
        "Este payload contém pequenos recortes de uma planilha de cardápio hospitalar. "
        "Cada item em workbook.sheets é um bloco de cardápio separado, iniciado por seu próprio cabeçalho. "
        "Interprete todos os blocos e devolva uma estrutura única em dias > refeições > cardápios > tipos > sugestões. "
        "Use os cabeçalhos detectados apenas como pontos de partida extraídos da própria planilha. "
        "Preserve a hierarquia visual dentro de cada bloco: título do cardápio, tipos/subtítulos, itens comuns, sugestões e itens das sugestões. "
        "Não classifique alimentos por categoria clínica nesta etapa; mantenha o texto como aparece no cardápio. "
        "Não invente dados e não use conhecimento prévio sobre hospitais. "
        "Toda célula com texto útil destes recortes deve estar em celulasUsadas, celulasIgnoradas com motivo, ou celulasPendentes."
    )
    prompt["detectedHeaders"] = [
        {
            "sheet": block["raw"]["sheets"][0]["name"],
            **block["header"]["headerInfo"],
        }
        for block in blocks
    ]
    prompt["completenessContract"] = {
        "required": True,
        "rule": (
            "Para cada célula útil, preserve o ref exato. Não una células de colunas diferentes, "
            "não copie itens de um bloco para outro e não resuma listas. Uma célula só pode ser "
            "usada se o texto dela aparecer literalmente na saída; caso contrário, marque-a como "
            "ignorada com motivo ou pendente."
        ),
        "sourceCellCount": len(batch_raw["usefulCells"]),
        "sourceRefs": [source_ref(cell) for cell in batch_raw["usefulCells"]],
    }
    return prompt, batch_raw


def build_source_structure(blocks):
    """Keep an exact, model-independent copy of every detected menu block."""
    result = []
    for block in blocks:
        header = block["header"]["headerInfo"]
        cells = [
            {
                "ref": source_ref(cell),
                "row": cell["row"],
                "column": cell["column"],
                "rowSpan": cell["rowSpan"],
                "columnSpan": cell["columnSpan"],
                "text": cell["text"],
            }
            for cell in block["raw"]["usefulCells"]
        ]
        result.append(
            {
                "sheet": block["raw"]["sheets"][0]["name"],
                "header": header,
                "sourceRefs": [cell["ref"] for cell in cells],
                "cells": cells,
            }
        )
    return result


def merge_block_result(target, block, block_result, model):
    header = block["header"]["headerInfo"]
    days = block_result.get("dias") or []
    if not days:
        days = [
            {
                "data": header.get("date", ""),
                "diaSemana": header.get("dayName", ""),
                "refeicoes": [
                    {
                        "nome": header.get("mealName", ""),
                        "cardapios": [
                            {
                                "titulo": header.get("title", ""),
                                "tipos": [],
                                "sourceRefs": [source_ref(block["header"])],
                            }
                        ],
                    }
                ],
            }
        ]

    for day in days:
        if not day.get("data") and header.get("date"):
            day["data"] = header["date"]
        if not day.get("diaSemana") and header.get("dayName"):
            day["diaSemana"] = header["dayName"]
        for meal in day.get("refeicoes") or []:
            if not meal.get("nome") and header.get("mealName"):
                meal["nome"] = header["mealName"]
            for card in meal.get("cardapios") or []:
                if not card.get("titulo"):
                    card["titulo"] = header.get("title", "")

    target["dias"].extend(days)
    target["celulasUsadas"].extend(block_result.get("celulasUsadas") or [])
    target["celulasIgnoradas"].extend(block_result.get("celulasIgnoradas") or [])
    target["celulasPendentes"].extend(block_result.get("celulasPendentes") or [])
    target["_blockConfidences"].append(float(block_result.get("confianca") or 0))
    target["_aiModel"] = model


def call_gemini_by_blocks(raw_workbook, api_key, models, blocks):
    structured = {
        "periodos": [],
        "dias": [],
        "celulasUsadas": [],
        "celulasIgnoradas": [],
        "celulasPendentes": [],
        "blocosFonte": build_source_structure(blocks[:MAX_BLOCKS_PER_IMPORT]),
        "confianca": 0,
        "_aiModel": None,
        "_blockConfidences": [],
    }

    selected_blocks = blocks[:MAX_BLOCKS_PER_IMPORT]
    block_refs = set()
    for block in selected_blocks:
        block_refs.update(block["sourceRefs"])

    batches = [
        selected_blocks[index:index + MAX_BLOCKS_PER_AI_BATCH]
        for index in range(0, len(selected_blocks), MAX_BLOCKS_PER_AI_BATCH)
    ]

    def interpret_batch(batch):
        prompt, batch_raw = build_batch_prompt(raw_workbook, batch)
        batch_error = None
        for model in models:
            try:
                return batch, call_gemini_model(batch_raw, api_key, model, prompt), model, None
            except RuntimeError as exc:
                batch_error = exc
                if "HTTP 404" not in str(exc):
                    break
        return batch, None, None, batch_error

    results = []
    with ThreadPoolExecutor(max_workers=min(MAX_PARALLEL_AI_BATCHES, len(batches))) as executor:
        future_map = {
            executor.submit(interpret_batch, batch): index
            for index, batch in enumerate(batches)
        }
        for future in as_completed(future_map):
            index = future_map[future]
            try:
                batch, batch_result, model, batch_error = future.result()
            except Exception as exc:
                batch = batches[index]
                batch_result = None
                model = None
                batch_error = exc
            results.append((index, batch, batch_result, model, batch_error))

    for _, batch, batch_result, model, batch_error in sorted(results, key=lambda item: item[0]):
        if batch_result:
            structured["dias"].extend(batch_result.get("dias") or [])
            structured["celulasUsadas"].extend(batch_result.get("celulasUsadas") or [])
            structured["celulasIgnoradas"].extend(batch_result.get("celulasIgnoradas") or [])
            structured["celulasPendentes"].extend(batch_result.get("celulasPendentes") or [])
            structured["_blockConfidences"].append(float(batch_result.get("confianca") or 0))
            structured["_aiModel"] = model
            continue
        for block in batch:
            structured["celulasPendentes"].extend(
                {"ref": ref, "motivo": f"Falha ao interpretar lote: {batch_error}"}
                for ref in sorted(block["sourceRefs"])
            )

    all_refs = {source_ref(cell) for cell in raw_workbook["usefulCells"]}
    for ref in sorted(all_refs - block_refs):
        structured["celulasIgnoradas"].append(
            {"ref": ref, "motivo": "Célula fora dos blocos de cardápio detectados."}
        )

    confidences = structured.pop("_blockConfidences")
    structured["confianca"] = sum(confidences) / len(confidences) if confidences else 0
    return structured


def call_gemini(raw_workbook):
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    configured_model = os.environ.get("GEMINI_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL
    fallback_models = [DEFAULT_MODEL, "gemini-3.5-flash-lite"]
    models = []
    for model_name in [configured_model, *fallback_models]:
        if model_name not in models:
            models.append(model_name)

    blocks = detect_menu_blocks(raw_workbook)
    if blocks:
        return call_gemini_by_blocks(raw_workbook, api_key, models, blocks)

    last_error = None
    for model in models:
        try:
            return call_gemini_model(raw_workbook, api_key, model)
        except RuntimeError as exc:
            last_error = exc
            if "HTTP 404" not in str(exc):
                raise

    if last_error:
        raise last_error
    return None


def call_gemini_model(raw_workbook, api_key, model, prompt=None):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    prompt = prompt or build_ai_prompt(raw_workbook)
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": json.dumps(prompt, ensure_ascii=False)}],
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
        },
    }
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib_request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib_request.urlopen(req, timeout=90) as response:
            body = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Gemini HTTP {exc.code}: {detail}") from exc
    except URLError as exc:
        raise RuntimeError(f"Erro de conexão com Gemini: {exc.reason}") from exc

    text = body["candidates"][0]["content"]["parts"][0]["text"]
    result = json.loads(text)
    result["_aiModel"] = model
    return result


def fallback_without_ai(raw_workbook):
    return {
        "dias": [],
        "celulasUsadas": [],
        "celulasIgnoradas": [],
        "celulasPendentes": [
            {
                "ref": f"{cell['sheetIndex']}!{cell['address']}",
                "motivo": "IA não configurada; célula aguardando classificação estrutural.",
            }
            for cell in raw_workbook["usefulCells"]
        ],
        "confianca": 0,
        "_aiModel": None,
    }


def validate_ai_result(raw_workbook, structured):
    all_refs = {f"{cell['sheetIndex']}!{cell['address']}" for cell in raw_workbook["usefulCells"]}
    used = set(structured.get("celulasUsadas") or [])
    ignored = {item.get("ref") for item in structured.get("celulasIgnoradas") or [] if item.get("ref")}
    pending = {item.get("ref") for item in structured.get("celulasPendentes") or [] if item.get("ref")}
    accounted = used | ignored | pending
    missing = sorted(all_refs - accounted)

    if missing:
        structured.setdefault("celulasPendentes", [])
        structured["celulasPendentes"].extend(
            {"ref": ref, "motivo": "Célula útil não classificada pelo modelo."}
            for ref in missing
        )
        pending.update(missing)

    return {
        "totalUsefulCells": len(all_refs),
        "usedCells": len(used),
        "ignoredCells": len(ignored),
        "pendingCells": len(pending),
        "missingCells": len(missing),
        "canPersist": len(pending) == 0 and float(structured.get("confianca") or 0) >= 0.85,
    }


class Store:
    def __init__(self):
        self.database_url = os.environ.get("DATABASE_URL", "").strip()
        self.sqlite_path = os.environ.get("SQLITE_PATH", "./nutrimenu.db")
        self.kind = "postgres" if self.database_url else "sqlite"
        self.ready = False
        self.init_error = ""

    def connect(self):
        if self.kind == "postgres":
            if psycopg is None:
                raise RuntimeError("psycopg não está instalado para conectar ao Postgres.")
            return psycopg.connect(self.database_url, row_factory=dict_row)
        return sqlite3.connect(self.sqlite_path)

    def init(self):
        with self.connect() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS import_jobs (
                  id TEXT PRIMARY KEY,
                  filename TEXT NOT NULL,
                  file_hash TEXT NOT NULL,
                  status TEXT NOT NULL,
                  parser_version TEXT NOT NULL,
                  ai_model TEXT,
                  confidence REAL NOT NULL DEFAULT 0,
                  raw_cell_count INTEGER NOT NULL DEFAULT 0,
                  used_cell_count INTEGER NOT NULL DEFAULT 0,
                  ignored_cell_count INTEGER NOT NULL DEFAULT 0,
                  pending_cell_count INTEGER NOT NULL DEFAULT 0,
                  payload TEXT NOT NULL,
                  created_at TEXT NOT NULL
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS master_entities (
                  id TEXT PRIMARY KEY,
                  entity_type TEXT NOT NULL,
                  normalized_name TEXT NOT NULL,
                  display_name TEXT NOT NULL,
                  created_at TEXT NOT NULL,
                  UNIQUE(entity_type, normalized_name)
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS menu_days (
                  id TEXT PRIMARY KEY,
                  import_id TEXT NOT NULL,
                  date_text TEXT NOT NULL,
                  day_name TEXT,
                  source_sheet TEXT,
                  created_at TEXT NOT NULL
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS meal_cards (
                  id TEXT PRIMARY KEY,
                  day_id TEXT NOT NULL,
                  meal_name TEXT NOT NULL,
                  title TEXT NOT NULL,
                  order_index INTEGER NOT NULL DEFAULT 0,
                  source_refs TEXT NOT NULL,
                  created_at TEXT NOT NULL
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS menu_types (
                  id TEXT PRIMARY KEY,
                  card_id TEXT NOT NULL,
                  title TEXT NOT NULL,
                  order_index INTEGER NOT NULL DEFAULT 0,
                  source_refs TEXT NOT NULL,
                  created_at TEXT NOT NULL
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS menu_items (
                  id TEXT PRIMARY KEY,
                  type_id TEXT NOT NULL,
                  suggestion_title TEXT,
                  item_text TEXT NOT NULL,
                  source_refs TEXT NOT NULL,
                  created_at TEXT NOT NULL
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS cell_audit (
                  id TEXT PRIMARY KEY,
                  import_id TEXT NOT NULL,
                  source_ref TEXT NOT NULL,
                  sheet_name TEXT NOT NULL,
                  address TEXT NOT NULL,
                  text TEXT NOT NULL,
                  status TEXT NOT NULL,
                  reason TEXT,
                  created_at TEXT NOT NULL
                )
                """
            )
            conn.commit()
            self.ready = True
            self.init_error = ""

    def execute(self, conn, sql, values):
        if self.kind == "postgres":
            sql = sql.replace("?", "%s")
        conn.cursor().execute(sql, values)

    def create_processing_import(self, raw_workbook):
        import_id = str(uuid.uuid4())
        payload = {
            "summary": {
                "fileName": raw_workbook["fileName"],
                "sheetCount": raw_workbook["sheetCount"],
                "fileHash": raw_workbook["sha256"],
            }
        }
        with self.connect() as conn:
            self.execute(
                conn,
                """
                INSERT INTO import_jobs (
                  id, filename, file_hash, status, parser_version, ai_model, confidence,
                  raw_cell_count, used_cell_count, ignored_cell_count, pending_cell_count,
                  payload, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    import_id,
                    raw_workbook["fileName"],
                    raw_workbook["sha256"],
                    "processing",
                    PARSER_VERSION,
                    None,
                    0,
                    len(raw_workbook["usefulCells"]),
                    0,
                    0,
                    len(raw_workbook["usefulCells"]),
                    json.dumps(payload, ensure_ascii=False),
                    now_iso(),
                ),
            )
            conn.commit()
        return import_id

    def complete_import(self, import_id, raw_workbook, structured, validation):
        status = "persisted" if validation["canPersist"] else "needs_review"
        timestamp = now_iso()
        with self.connect() as conn:
            self.execute(
                conn,
                """
                UPDATE import_jobs
                SET status = ?, ai_model = ?, confidence = ?, raw_cell_count = ?,
                    used_cell_count = ?, ignored_cell_count = ?, pending_cell_count = ?,
                    payload = ?
                WHERE id = ?
                """,
                (
                    status,
                    structured.get("_aiModel"),
                    float(structured.get("confianca") or 0),
                    validation["totalUsefulCells"],
                    validation["usedCells"],
                    validation["ignoredCells"],
                    validation["pendingCells"],
                    json.dumps(structured, ensure_ascii=False),
                    import_id,
                ),
            )
            self.save_cell_audit(conn, import_id, raw_workbook, structured, timestamp)
            if validation["canPersist"]:
                self.save_menu(conn, import_id, structured, timestamp)
            conn.commit()
        return status

    def fail_import(self, import_id, raw_workbook, error):
        payload = {
            "error": str(error),
            "summary": {
                "fileName": raw_workbook["fileName"],
                "sheetCount": raw_workbook["sheetCount"],
                "fileHash": raw_workbook["sha256"],
            },
        }
        with self.connect() as conn:
            self.execute(
                conn,
                "UPDATE import_jobs SET status = ?, payload = ? WHERE id = ?",
                ("failed", json.dumps(payload, ensure_ascii=False), import_id),
            )
            conn.commit()

    def get_import(self, import_id):
        with self.connect() as conn:
            sql = "SELECT * FROM import_jobs WHERE id = ?"
            if self.kind == "postgres":
                sql = sql.replace("?", "%s")
            cur = conn.cursor()
            cur.execute(sql, (import_id,))
            row = cur.fetchone()
            if not row:
                return None
            if isinstance(row, dict):
                return row
            columns = [column[0] for column in cur.description]
            return dict(zip(columns, row))

    def save_import(self, raw_workbook, structured, validation):
        import_id = str(uuid.uuid4())
        status = "persisted" if validation["canPersist"] else "needs_review"
        timestamp = now_iso()

        with self.connect() as conn:
            self.execute(
                conn,
                """
                INSERT INTO import_jobs (
                  id, filename, file_hash, status, parser_version, ai_model, confidence,
                  raw_cell_count, used_cell_count, ignored_cell_count, pending_cell_count,
                  payload, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    import_id,
                    raw_workbook["fileName"],
                    raw_workbook["sha256"],
                    status,
                    PARSER_VERSION,
                    structured.get("_aiModel"),
                    float(structured.get("confianca") or 0),
                    validation["totalUsefulCells"],
                    validation["usedCells"],
                    validation["ignoredCells"],
                    validation["pendingCells"],
                    json.dumps(structured, ensure_ascii=False),
                    timestamp,
                ),
            )
            self.save_cell_audit(conn, import_id, raw_workbook, structured, timestamp)
            if validation["canPersist"]:
                self.save_menu(conn, import_id, structured, timestamp)
            conn.commit()

        return import_id, status

    def save_cell_audit(self, conn, import_id, raw_workbook, structured, timestamp):
        status_by_ref = {}
        for ref in structured.get("celulasUsadas") or []:
            status_by_ref[ref] = ("used", "")
        for item in structured.get("celulasIgnoradas") or []:
            status_by_ref[item.get("ref")] = ("ignored", item.get("motivo", ""))
        for item in structured.get("celulasPendentes") or []:
            status_by_ref[item.get("ref")] = ("pending", item.get("motivo", ""))

        for cell in raw_workbook["usefulCells"]:
            ref = f"{cell['sheetIndex']}!{cell['address']}"
            status, reason = status_by_ref.get(ref, ("pending", "Célula sem classificação."))
            self.execute(
                conn,
                """
                INSERT INTO cell_audit (
                  id, import_id, source_ref, sheet_name, address, text, status, reason, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid.uuid4()),
                    import_id,
                    ref,
                    cell["sheet"],
                    cell["address"],
                    cell["text"],
                    status,
                    reason,
                    timestamp,
                ),
            )

    def save_menu(self, conn, import_id, structured, timestamp):
        for day in structured.get("dias") or []:
            day_id = str(uuid.uuid4())
            self.execute(
                conn,
                "INSERT INTO menu_days (id, import_id, date_text, day_name, source_sheet, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (day_id, import_id, day.get("data", ""), day.get("diaSemana", ""), "", timestamp),
            )
            for meal in day.get("refeicoes") or []:
                for card_index, card in enumerate(meal.get("cardapios") or []):
                    card_id = str(uuid.uuid4())
                    self.execute(
                        conn,
                        """
                        INSERT INTO meal_cards (
                          id, day_id, meal_name, title, order_index, source_refs, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            card_id,
                            day_id,
                            meal.get("nome", ""),
                            card.get("titulo", ""),
                            card_index,
                            json.dumps(card.get("sourceRefs") or [], ensure_ascii=False),
                            timestamp,
                        ),
                    )
                    for type_index, menu_type in enumerate(card.get("tipos") or []):
                        type_id = str(uuid.uuid4())
                        self.execute(
                            conn,
                            """
                            INSERT INTO menu_types (
                              id, card_id, title, order_index, source_refs, created_at
                            ) VALUES (?, ?, ?, ?, ?, ?)
                            """,
                            (
                                type_id,
                                card_id,
                                menu_type.get("titulo", ""),
                                type_index,
                                json.dumps(menu_type.get("sourceRefs") or [], ensure_ascii=False),
                                timestamp,
                            ),
                        )
                        for item in menu_type.get("itensComuns") or []:
                            self.save_item(conn, type_id, None, item, menu_type.get("sourceRefs") or [], timestamp)
                        for suggestion in menu_type.get("sugestoes") or []:
                            for item in suggestion.get("itens") or []:
                                self.save_item(conn, type_id, suggestion.get("titulo", ""), item, menu_type.get("sourceRefs") or [], timestamp)

    def save_item(self, conn, type_id, suggestion_title, item_text, source_refs, timestamp):
        clean = str(item_text or "").strip()
        if not clean:
            return
        self.execute(
            conn,
            "INSERT INTO menu_items (id, type_id, suggestion_title, item_text, source_refs, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (
                str(uuid.uuid4()),
                type_id,
                suggestion_title,
                clean,
                json.dumps(source_refs, ensure_ascii=False),
                timestamp,
            ),
        )
        entity_type = "preparacao"
        self.execute(
            conn,
            """
            INSERT INTO master_entities (id, entity_type, normalized_name, display_name, created_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT DO NOTHING
            """,
            (str(uuid.uuid4()), entity_type, normalize_text(clean), clean, timestamp),
        )


def parse_multipart(handler):
    content_type = handler.headers.get("Content-Type", "")
    if not content_type.startswith("multipart/form-data"):
        raise ValueError("Envie a planilha como multipart/form-data no campo 'file'.")

    length = int(handler.headers.get("Content-Length", "0"))
    if length <= 0 or length > MAX_UPLOAD_BYTES:
        raise ValueError("Arquivo vazio ou maior que o limite permitido.")

    body = handler.rfile.read(length)
    message = BytesParser(policy=email_policy).parsebytes(
        f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode("utf-8")
        + body
    )
    if not message.is_multipart():
        raise ValueError("Corpo multipart inválido.")

    filename = ""
    file_bytes = b""
    for part in message.iter_parts():
        params = dict(part.get_params(header="content-disposition", failobj=[]) or [])
        if params.get("name") != "file":
            continue
        filename = os.path.basename(params.get("filename", ""))
        file_bytes = part.get_payload(decode=True) or b""
        break

    if not filename:
        raise ValueError("Campo 'file' não encontrado.")
    if not filename.lower().endswith(".xlsx"):
        raise ValueError("Envie um arquivo .xlsx.")
    if not file_bytes:
        raise ValueError("Arquivo vazio.")

    return filename, file_bytes


def allowed_origin(origin):
    allowed = [
        item.strip()
        for item in os.environ.get("ALLOWED_ORIGINS", "*").split(",")
        if item.strip()
    ]
    return "*" in allowed or origin in allowed


def import_summary(raw_workbook, structured=None):
    structured = structured or {}
    return {
        "fileName": raw_workbook["fileName"],
        "sheetCount": raw_workbook["sheetCount"],
        "fileHash": raw_workbook["sha256"],
        "periodCount": len(structured.get("periodos") or []),
        "dayCount": len(structured.get("dias") or []),
    }


def import_response(import_id, status, raw_workbook, structured, validation, include_result):
    payload = {
        "importId": import_id,
        "status": status,
        "parserVersion": PARSER_VERSION,
        "aiModel": structured.get("_aiModel") if structured else None,
        "validation": validation,
        "summary": import_summary(raw_workbook, structured),
    }
    if include_result and structured:
        payload["result"] = structured
    return payload


def process_import_job(store, import_id, raw_workbook):
    try:
        structured = call_gemini(raw_workbook) or fallback_without_ai(raw_workbook)
        validation = validate_ai_result(raw_workbook, structured)
        store.complete_import(import_id, raw_workbook, structured, validation)
    except Exception as exc:
        store.fail_import(import_id, raw_workbook, exc)


class Handler(BaseHTTPRequestHandler):
    store = Store()

    def end_headers(self):
        origin = self.headers.get("Origin", "")
        if allowed_origin(origin):
            self.send_header("Access-Control-Allow-Origin", origin or "*")
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type,Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_GET(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path == "/health":
            self.write_json(
                {
                    "ok": self.store.ready,
                    "parserVersion": PARSER_VERSION,
                    "database": self.store.kind,
                    "databaseReady": self.store.ready,
                    "databaseError": self.store.init_error,
                    "geminiConfigured": bool(os.environ.get("GEMINI_API_KEY", "").strip()),
                }
            )
            return

        import_match = re.match(r"^/api/import-cardapio/([^/]+)$", parsed_path.path)
        if import_match:
            query = parse_qs(parsed_path.query)
            include_result = query.get("includeResult") == ["1"]
            record = self.store.get_import(import_match.group(1))
            if not record:
                self.write_json({"error": "Importação não encontrada."}, HTTPStatus.NOT_FOUND)
                return

            stored_payload = json.loads(record.get("payload") or "{}")
            structured = stored_payload if isinstance(stored_payload, dict) and "dias" in stored_payload else None
            validation = {
                "totalUsefulCells": int(record.get("raw_cell_count") or 0),
                "usedCells": int(record.get("used_cell_count") or 0),
                "ignoredCells": int(record.get("ignored_cell_count") or 0),
                "pendingCells": int(record.get("pending_cell_count") or 0),
                "missingCells": 0,
                "canPersist": record.get("status") == "persisted",
            }
            summary = stored_payload.get("summary") if isinstance(stored_payload, dict) else None
            response = {
                "importId": record["id"],
                "status": record["status"],
                "parserVersion": record["parser_version"],
                "aiModel": record.get("ai_model"),
                "validation": validation,
                "summary": summary or {
                    "fileName": record["filename"],
                    "sheetCount": 0,
                    "fileHash": record["file_hash"],
                    "periodCount": len(structured.get("periodos") or []) if structured else 0,
                    "dayCount": len(structured.get("dias") or []) if structured else 0,
                },
            }
            if record["status"] == "failed":
                response["error"] = stored_payload.get("error", "Falha na importação.")
            if include_result and structured:
                response["result"] = structured
            self.write_json(response)
            return
        self.write_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)

    def do_POST(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path != "/api/import-cardapio":
            self.write_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)
            return

        try:
            query = parse_qs(parsed_path.query)
            include_result = query.get("includeResult") == ["1"]
            async_mode = query.get("async") == ["1"]
            filename, file_bytes = parse_multipart(self)
            raw = read_workbook(file_bytes, filename)

            if async_mode:
                import_id = self.store.create_processing_import(raw)
                worker = threading.Thread(
                    target=process_import_job,
                    args=(self.store, import_id, raw),
                    daemon=True,
                )
                worker.start()
                self.write_json(
                    import_response(
                        import_id,
                        "processing",
                        raw,
                        None,
                        {
                            "totalUsefulCells": len(raw["usefulCells"]),
                            "usedCells": 0,
                            "ignoredCells": 0,
                            "pendingCells": len(raw["usefulCells"]),
                            "missingCells": 0,
                            "canPersist": False,
                        },
                        False,
                    ),
                    HTTPStatus.ACCEPTED,
                )
                return

            structured = call_gemini(raw) or fallback_without_ai(raw)
            validation = validate_ai_result(raw, structured)
            import_id, status = self.store.save_import(raw, structured, validation)
            self.write_json(
                import_response(import_id, status, raw, structured, validation, include_result),
                HTTPStatus.CREATED if status == "persisted" else HTTPStatus.ACCEPTED,
            )
        except Exception as exc:
            self.write_json({"error": str(exc)}, HTTPStatus.BAD_REQUEST)

    def write_json(self, payload, status=HTTPStatus.OK):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    port = int(os.environ.get("PORT", "8000"))
    try:
        Handler.store.init()
    except Exception as exc:
        Handler.store.ready = False
        Handler.store.init_error = str(exc)
        print(f"Database initialization failed: {exc}", flush=True)
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"NutriMenu AI API listening on :{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
