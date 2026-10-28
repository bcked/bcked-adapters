"""Text extraction from attestation PDFs, shared by the extract_* scripts. Requires pdftotext (poppler)."""
import re
import subprocess


def pdf_text(path):
    text = subprocess.run(["pdftotext", "-layout", path, "-"], capture_output=True, text=True, timeout=60).stdout
    # Some reports contain invisible directional formatting characters, sometimes inside words ("T otal").
    text = re.sub(r"[‎‏‪-‮]", "", text)
    return re.sub(r"\bT (otal)", r"T\1", text)
