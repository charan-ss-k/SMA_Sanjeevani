"""
Google Cloud Vision OCR service for handwritten prescription extraction.
"""

import base64
import logging
from typing import Any, Dict

import cv2
import numpy as np
import requests

logger = logging.getLogger(__name__)


class GoogleVisionOCRService:
    """Thin wrapper around Google Cloud Vision REST OCR API."""

    ENDPOINT_TEMPLATE = "https://vision.googleapis.com/v1/images:annotate?key={api_key}"

    @staticmethod
    def extract_text_from_image(image: Any, api_key: str, language_hints=None) -> Dict[str, Any]:
        """
        Extract text from an image using Google Vision OCR.

        Args:
            image: numpy image array (BGR/gray) or raw bytes
            api_key: Google Vision API key
            language_hints: Optional list of BCP-47 language hints

        Returns:
            OCR result dictionary with text, confidence and metadata
        """
        if not api_key or not api_key.strip():
            return {
                "status": "error",
                "error": "Google Vision API key missing",
                "text": "",
                "confidence": 0.0,
            }

        try:
            image_bytes = GoogleVisionOCRService._to_bytes(image)
            if not image_bytes:
                return {
                    "status": "error",
                    "error": "Invalid image payload",
                    "text": "",
                    "confidence": 0.0,
                }

            encoded_content = base64.b64encode(image_bytes).decode("utf-8")
            hints = language_hints or ["en-t-i0-handwrit"]
            request_body = {
                "requests": [
                    {
                        "image": {"content": encoded_content},
                        "features": [{"type": "DOCUMENT_TEXT_DETECTION"}],
                        "imageContext": {"languageHints": hints},
                    }
                ]
            }

            endpoint = GoogleVisionOCRService.ENDPOINT_TEMPLATE.format(api_key=api_key.strip())
            response = requests.post(endpoint, json=request_body, timeout=45)

            if response.status_code != 200:
                logger.error("Google Vision API failed: %s - %s", response.status_code, response.text[:500])
                return {
                    "status": "error",
                    "error": f"Google Vision API failed with status {response.status_code}",
                    "text": "",
                    "confidence": 0.0,
                }

            payload = response.json()
            responses = payload.get("responses", [])
            if not responses:
                return {
                    "status": "warning",
                    "error": "No OCR response from Google Vision",
                    "text": "",
                    "confidence": 0.0,
                }

            result = responses[0]
            if "error" in result:
                message = result["error"].get("message", "Unknown Google Vision error")
                logger.error("Google Vision OCR error: %s", message)
                return {
                    "status": "error",
                    "error": message,
                    "text": "",
                    "confidence": 0.0,
                }

            text = result.get("fullTextAnnotation", {}).get("text", "").strip()
            if not text:
                annotations = result.get("textAnnotations", [])
                if annotations:
                    text = annotations[0].get("description", "").strip()

            confidence = GoogleVisionOCRService._extract_confidence(result)
            hierarchy = GoogleVisionOCRService._extract_hierarchy(result)

            return {
                "status": "success" if text else "warning",
                "text": text,
                "confidence": confidence,
                "request": {
                    "type": "DOCUMENT_TEXT_DETECTION",
                    "language_hints": hints,
                },
                "hierarchy": hierarchy,
            }
        except Exception as exc:
            logger.error("Google Vision OCR extraction failed: %s", exc, exc_info=True)
            return {
                "status": "error",
                "error": str(exc),
                "text": "",
                "confidence": 0.0,
            }

    @staticmethod
    def _to_bytes(image: Any) -> bytes:
        if isinstance(image, (bytes, bytearray)):
            return bytes(image)

        if isinstance(image, np.ndarray):
            success, buffer = cv2.imencode(".png", image)
            if not success:
                return b""
            return buffer.tobytes()

        return b""

    @staticmethod
    def _extract_confidence(result: Dict[str, Any]) -> float:
        confidences = []
        full_text = result.get("fullTextAnnotation", {})
        for page in full_text.get("pages", []):
            for block in page.get("blocks", []):
                conf = block.get("confidence")
                if isinstance(conf, (int, float)):
                    confidences.append(float(conf))
        if not confidences:
            return 0.85
        return float(sum(confidences) / len(confidences))

    @staticmethod
    def _extract_hierarchy(result: Dict[str, Any]) -> Dict[str, Any]:
        """Return OCR hierarchy: fullTextAnnotation -> pages -> blocks -> paragraphs -> words."""
        full_text = result.get("fullTextAnnotation", {})
        hierarchy_pages = []

        for page_idx, page in enumerate(full_text.get("pages", []), start=1):
            page_blocks = []
            for block_idx, block in enumerate(page.get("blocks", []), start=1):
                block_conf = float(block.get("confidence", 0.0) or 0.0)
                paragraphs_out = []

                for para_idx, para in enumerate(block.get("paragraphs", []), start=1):
                    para_conf = float(para.get("confidence", 0.0) or 0.0)
                    words_out = []
                    para_word_texts = []

                    for word_idx, word in enumerate(para.get("words", []), start=1):
                        symbols = word.get("symbols", [])
                        word_text = "".join(symbol.get("text", "") for symbol in symbols)
                        if word_text:
                            para_word_texts.append(word_text)
                        words_out.append(
                            {
                                "index": word_idx,
                                "text": word_text,
                                "confidence": float(word.get("confidence", 0.0) or 0.0),
                            }
                        )

                    paragraphs_out.append(
                        {
                            "index": para_idx,
                            "text": " ".join(para_word_texts).strip(),
                            "confidence": para_conf,
                            "words": words_out,
                        }
                    )

                block_text = "\n".join(paragraph.get("text", "") for paragraph in paragraphs_out if paragraph.get("text"))
                page_blocks.append(
                    {
                        "index": block_idx,
                        "text": block_text.strip(),
                        "confidence": block_conf,
                        "paragraphs": paragraphs_out,
                    }
                )

            hierarchy_pages.append(
                {
                    "index": page_idx,
                    "confidence": float(page.get("confidence", 0.0) or 0.0),
                    "blocks": page_blocks,
                }
            )

        return {
            "text": full_text.get("text", "").strip(),
            "pages": hierarchy_pages,
        }
