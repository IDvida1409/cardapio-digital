import json
import os
import unittest
from io import BytesIO
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError

import app


class GeminiRetryTests(unittest.TestCase):
    def test_retries_503_then_returns_result(self):
        unavailable = HTTPError(
            "https://example.test",
            503,
            "Unavailable",
            {},
            BytesIO(b'{"error":{"status":"UNAVAILABLE"}}'),
        )
        response = MagicMock()
        response.__enter__.return_value.read.return_value = json.dumps(
            {
                "candidates": [
                    {"content": {"parts": [{"text": '{"dias": []}'}]}}
                ]
            }
        ).encode("utf-8")

        env = {
            "GEMINI_MAX_ATTEMPTS": "2",
            "GEMINI_RETRY_BASE_SECONDS": "0.1",
        }
        with patch.dict(os.environ, env, clear=False), patch.object(
            app.urllib_request,
            "urlopen",
            side_effect=[unavailable, response],
        ) as urlopen, patch.object(app.time, "sleep") as sleep:
            result = app.call_gemini_model(
                {"usefulCells": []},
                "key",
                "model",
                {"test": True},
            )

        self.assertEqual(result["dias"], [])
        self.assertEqual(result["_aiModel"], "model")
        self.assertEqual(urlopen.call_count, 2)
        sleep.assert_called_once()

    def test_does_not_retry_permission_error(self):
        forbidden = HTTPError(
            "https://example.test",
            403,
            "Forbidden",
            {},
            BytesIO(b'{"error":{"status":"PERMISSION_DENIED"}}'),
        )
        with patch.dict(os.environ, {"GEMINI_MAX_ATTEMPTS": "4"}, clear=False), patch.object(
            app.urllib_request,
            "urlopen",
            side_effect=forbidden,
        ) as urlopen, patch.object(app.time, "sleep") as sleep:
            with self.assertRaises(app.GeminiRequestError) as raised:
                app.call_gemini_model(
                    {"usefulCells": []},
                    "key",
                    "model",
                    {"test": True},
                )

        self.assertEqual(raised.exception.status_code, 403)
        self.assertFalse(raised.exception.retryable)
        self.assertEqual(urlopen.call_count, 1)
        sleep.assert_not_called()

    def test_falls_back_after_retryable_model_failure(self):
        result = {"dias": [], "_aiModel": app.DEFAULT_MODEL}
        retryable_error = app.GeminiRequestError(
            "Gemini HTTP 503",
            status_code=503,
            retryable=True,
        )
        with patch.dict(
            os.environ,
            {"GEMINI_API_KEY": "key", "GEMINI_MODEL": "primary-model"},
            clear=False,
        ), patch.object(app, "detect_menu_blocks", return_value=[]), patch.object(
            app,
            "call_gemini_model",
            side_effect=[retryable_error, result],
        ) as call_model:
            imported = app.call_gemini({"usefulCells": []})

        self.assertIs(imported, result)
        self.assertEqual(call_model.call_args_list[0].args[2], "primary-model")
        self.assertEqual(call_model.call_args_list[1].args[2], app.DEFAULT_MODEL)

    def test_final_404_does_not_hide_previous_503(self):
        unavailable = app.GeminiRequestError(
            "Gemini HTTP 503",
            status_code=503,
            retryable=True,
        )
        not_found = app.GeminiRequestError(
            "Gemini HTTP 404",
            status_code=404,
            retryable=False,
        )
        with patch.dict(
            os.environ,
            {"GEMINI_API_KEY": "key", "GEMINI_MODEL": "primary-model"},
            clear=False,
        ), patch.object(app, "detect_menu_blocks", return_value=[]), patch.object(
            app,
            "call_gemini_model",
            side_effect=[unavailable, not_found, not_found, not_found],
        ):
            with self.assertRaises(app.GeminiRequestError) as raised:
                app.call_gemini({"usefulCells": []})

        self.assertEqual(raised.exception.status_code, 503)


if __name__ == "__main__":
    unittest.main()
