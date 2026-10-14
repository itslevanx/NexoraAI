from __future__ import annotations

import re
from pathlib import Path

from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "PUBLICIDAD_UTP.md"
OUTPUT = ROOT / "docs" / "Documentacion_Publicidad_UTP.docx"
ICON = ROOT / "assets" / "nexora-icon.png"


def shade(cell, color: str) -> None:
    props = cell._tc.get_or_add_tcPr()
    node = props.find(qn("w:shd"))
    if node is None:
        node = OxmlElement("w:shd")
        props.append(node)
    node.set(qn("w:fill"), color)


def cell_margins(cell, value: int = 115) -> None:
    props = cell._tc.get_or_add_tcPr()
    margins = props.first_child_found_in("w:tcMar")
    if margins is None:
        margins = OxmlElement("w:tcMar")
        props.append(margins)
    for edge in ("top", "start", "bottom", "end"):
        node = margins.find(qn(f"w:{edge}"))
        if node is None:
            node = OxmlElement(f"w:{edge}")
            margins.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def no_split(row) -> None:
    props = row._tr.get_or_add_trPr()
    props.append(OxmlElement("w:cantSplit"))


def repeat_header(row) -> None:
    props = row._tr.get_or_add_trPr()
    node = OxmlElement("w:tblHeader")
    node.set(qn("w:val"), "true")
    props.append(node)


def add_page_number(paragraph) -> None:
    paragraph.add_run("NEXORA AI   •   Publicidad UTP   •   ")
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instruction = OxmlElement("w:instrText")
    instruction.set(qn("xml:space"), "preserve")
    instruction.text = " PAGE "
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run._r.extend((begin, instruction, end))


def inline(paragraph, text: str) -> None:
    pattern = re.compile(r"(\*\*[^*]+\*\*|\`[^\`]+\`|\[[^]]+\]\([^)]+\))")
    cursor = 0
    for match in pattern.finditer(text):
        if match.start() > cursor:
            paragraph.add_run(text[cursor : match.start()])
        token = match.group(0)
        if token.startswith("**"):
            run = paragraph.add_run(token[2:-2])
            run.bold = True
        elif token.startswith("`"):
            run = paragraph.add_run(token[1:-1])
            run.font.name = "Aptos Mono"
            run.font.size = Pt(9)
        else:
            label, url = re.match(r"\[([^]]+)\]\(([^)]+)\)", token).groups()
            run = paragraph.add_run(f"{label} ({url})")
            run.font.color.rgb = RGBColor(55, 55, 55)
        cursor = match.end()
    if cursor < len(text):
        paragraph.add_run(text[cursor:])


def setup(doc: Document) -> None:
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(0.7)
    section.bottom_margin = Inches(0.7)
    section.left_margin = Inches(0.78)
    section.right_margin = Inches(0.78)

    normal = doc.styles["Normal"]
    normal.font.name = "Aptos"
    normal.font.size = Pt(10.8)
    normal.font.color.rgb = RGBColor(24, 24, 24)
    normal.paragraph_format.space_after = Pt(7)
    normal.paragraph_format.line_spacing = 1.12

    for name, size, before, after in (
        ("Title", 30, 0, 14),
        ("Subtitle", 15, 0, 16),
        ("Heading 1", 20, 20, 8),
        ("Heading 2", 14, 14, 6),
        ("Heading 3", 11.5, 10, 4),
    ):
        style = doc.styles[name]
        style.font.name = "Aptos Display"
        style.font.size = Pt(size)
        style.font.color.rgb = RGBColor(0, 0, 0)
        style.font.bold = name != "Subtitle"
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.keep_with_next = True
        ppr = style._element.get_or_add_pPr()
        border = ppr.find(qn("w:pBdr"))
        if border is not None:
            ppr.remove(border)

    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.style = doc.styles["Normal"]
    add_page_number(footer)
    for run in footer.runs:
        run.font.size = Pt(8)
        run.font.color.rgb = RGBColor(110, 110, 110)


def cover(doc: Document) -> None:
    doc.add_paragraph()
    doc.add_paragraph()
    if ICON.exists():
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run().add_picture(str(ICON), width=Inches(1.1))
    title = doc.add_paragraph(style="Title")
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.add_run("Documentación del módulo Publicidad UTP")
    subtitle = doc.add_paragraph(style="Subtitle")
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle.add_run("Guía funcional y técnica para presentación")
    intro = doc.add_paragraph()
    intro.alignment = WD_ALIGN_PARAGRAPH.CENTER
    intro.paragraph_format.left_indent = Inches(0.7)
    intro.paragraph_format.right_indent = Inches(0.7)
    intro.paragraph_format.space_before = Pt(18)
    intro.add_run(
        "Creación de campañas audiovisuales de 10 a 30 segundos desde una fotografía "
        "mediante Google Veo, acceso protegido y montaje final en el navegador."
    )
    meta = doc.add_paragraph()
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    meta.paragraph_format.space_before = Pt(28)
    run = meta.add_run("Versión técnica   Octubre de 2026")
    run.font.size = Pt(10)
    run.font.color.rgb = RGBColor(90, 90, 90)
    doc.add_page_break()


def contents(doc: Document, lines: list[str]) -> None:
    doc.add_heading("Contenido", level=1)
    for line in lines:
        if line.startswith("## "):
            p = doc.add_paragraph(style="List Bullet")
            p.paragraph_format.space_after = Pt(4)
            p.add_run(line[3:])
    doc.add_page_break()


def add_table(doc: Document, rows: list[list[str]]) -> None:
    table = doc.add_table(rows=0, cols=max(len(row) for row in rows))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = True
    for row_index, values in enumerate(rows):
        row = table.add_row()
        no_split(row)
        if row_index == 0:
            repeat_header(row)
        for index, cell in enumerate(row.cells):
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            cell_margins(cell)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            inline(p, values[index] if index < len(values) else "")
            if row_index == 0:
                shade(cell, "222222")
                for run in p.runs:
                    run.bold = True
                    run.font.color.rgb = RGBColor(255, 255, 255)
            elif row_index % 2 == 0:
                shade(cell, "F4F4F4")
    after = doc.add_paragraph()
    after.paragraph_format.space_after = Pt(2)


def add_figure(doc: Document, source: str, caption: str) -> None:
    path = ROOT / "docs" / source
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.space_before = Pt(8)
    width = Inches(6.8)
    p.add_run().add_picture(str(path), width=width)
    label = doc.add_paragraph()
    label.alignment = WD_ALIGN_PARAGRAPH.CENTER
    label.paragraph_format.keep_together = True
    label.paragraph_format.space_after = Pt(10)
    run = label.add_run(caption)
    run.italic = True
    run.font.size = Pt(8.5)
    run.font.color.rgb = RGBColor(90, 90, 90)


def build() -> None:
    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    doc = Document()
    setup(doc)
    cover(doc)
    contents(doc, lines)

    index = 0
    in_code = False
    code: list[str] = []
    while index < len(lines):
        raw = lines[index]
        line = raw.rstrip()
        if line.startswith("# "):
            index += 1
            continue
        if line.startswith("```"):
            if in_code:
                p = doc.add_paragraph()
                p.paragraph_format.left_indent = Inches(0.22)
                p.paragraph_format.right_indent = Inches(0.22)
                p.paragraph_format.keep_together = True
                run = p.add_run("\n".join(code))
                run.font.name = "Aptos Mono"
                run.font.size = Pt(9)
                code = []
            in_code = not in_code
            index += 1
            continue
        if in_code:
            code.append(raw)
            index += 1
            continue
        if not line.strip():
            index += 1
            continue
        image = re.match(r"^!\[([^]]*)\]\(([^)]+)\)$", line)
        if image:
            caption, source = image.groups()
            add_figure(doc, source, caption)
            index += 1
            continue
        if line.startswith("|") and index + 1 < len(lines) and re.match(r"^\|[\s|:-]+\|$", lines[index + 1]):
            rows = [[cell.strip() for cell in line.strip("|").split("|")]]
            index += 2
            while index < len(lines) and lines[index].startswith("|"):
                rows.append([cell.strip() for cell in lines[index].strip("|").split("|")])
                index += 1
            add_table(doc, rows)
            continue
        if line in {
            "## Tecnologías utilizadas",
            "## Componentes del código",
            "## Fuentes oficiales",
        }:
            doc.add_page_break()
            doc.add_heading(line[3:], level=1)
        elif line == "### Etapa 6 Almacenamiento y galería":
            doc.add_page_break()
            doc.add_heading(line[4:], level=2)
        elif line.startswith("## "):
            doc.add_heading(line[3:], level=1)
        elif line.startswith("### "):
            doc.add_heading(line[4:], level=2)
        elif re.match(r"^\d+\. ", line):
            number, content = re.match(r"^(\d+)\. (.*)$", line).groups()
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.32)
            p.paragraph_format.first_line_indent = Inches(-0.32)
            inline(p, f"{number}.  {content}")
        elif line.startswith("- "):
            p = doc.add_paragraph(style="List Bullet")
            inline(p, line[2:])
        else:
            p = doc.add_paragraph()
            inline(p, line)
        index += 1

    doc.core_properties.title = "Documentación del módulo Publicidad UTP"
    doc.core_properties.subject = "Guía funcional y técnica para presentación"
    doc.core_properties.author = "NEXORA AI"
    doc.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    build()
