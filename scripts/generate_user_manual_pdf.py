from __future__ import annotations

from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
OUTPUT_PDF = ROOT_DIR / "docs" / "User_Manual.pdf"


def _escape_pdf_text(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def write_simple_pdf(path: Path, lines: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    page_width = 612
    page_height = 792
    left = 50
    top = 760
    font_size = 11
    line_height = 14

    stream_lines = ["BT", f"/F1 {font_size} Tf", f"{left} {top} Td"]
    for index, line in enumerate(lines):
        if index > 0:
            stream_lines.append(f"0 -{line_height} Td")
        stream_lines.append(f"({_escape_pdf_text(line)}) Tj")
    stream_lines.append("ET")
    stream_text = "\n".join(stream_lines)
    stream_bytes = stream_text.encode("latin-1", "replace")

    objects: list[bytes] = []
    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    objects.append(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    objects.append(
        (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {page_width} {page_height}] "
            f"/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>"
        ).encode("latin-1")
    )
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    objects.append(b"<< /Length " + str(len(stream_bytes)).encode("ascii") + b" >>\nstream\n" + stream_bytes + b"\nendstream")

    pdf = bytearray()
    pdf.extend(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode("ascii"))
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")

    xref_start = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("ascii"))

    pdf.extend(
        (
            f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref_start}\n%%EOF\n"
        ).encode("ascii")
    )
    path.write_bytes(pdf)


def main() -> None:
    lines = [
        "Tumaini Academy Learner Management System - User Manual",
        "",
        "1. Open the app and use tabs: Learners, Reporting, Reports, Backup & Settings.",
        "2. Learners tab: Add, Search, Update, Delete learners and manage parent details.",
        "3. Reporting tab: Search/select learner, set reporting time, add company, report arrival.",
        "4. Reports tab: Choose date range, report type, PDF/Word, then click Generate Report.",
        "5. Backup tab: Backup database and restore from backup .db files.",
        "6. Settings: Set school name, default reports folder, optional app password.",
        "7. Validation: Unique admission number, parent phone format, boarder transport=N/A.",
        "8. For full instructions see docs/User_Manual.md.",
    ]
    write_simple_pdf(OUTPUT_PDF, lines)
    print(f"Created {OUTPUT_PDF}")


if __name__ == "__main__":
    main()
