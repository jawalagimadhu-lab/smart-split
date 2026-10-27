"""
Smart Split — Export API
GET /export/csv/{type}
GET /export/pdf/{type}
Types: tasks | finance | documents
"""
import csv
import io
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.database import get_db
from app.models.models import Task, FinanceEntry, Document
from app.core.security import get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/export", tags=["export"])

VALID_TYPES = {"tasks", "finance", "documents"}


def _now_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


# ── CSV Export ────────────────────────────────────────────────
@router.get("/csv/{export_type}")
async def export_csv(
    export_type: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if export_type not in VALID_TYPES:
        raise HTTPException(status_code=400, detail=f"Unknown type. Valid: {sorted(VALID_TYPES)}")

    output = io.StringIO()

    if export_type == "tasks":
        result = await db.execute(select(Task).where(Task.user_id == user_id).order_by(Task.stage, Task.priority))
        tasks = result.scalars().all()
        writer = csv.writer(output)
        writer.writerow(["ID", "Title", "Stage", "Category", "Priority", "Status", "Due Date", "Completed At", "Notes"])
        for t in tasks:
            writer.writerow([
                t.id, t.title, t.stage, t.category, t.priority,
                t.status, t.due_date or "", t.completed_at or "", t.notes or "",
            ])

    elif export_type == "finance":
        result = await db.execute(select(FinanceEntry).where(FinanceEntry.user_id == user_id).order_by(FinanceEntry.type, FinanceEntry.category))
        entries = result.scalars().all()
        writer = csv.writer(output)
        writer.writerow(["ID", "Type", "Category", "Description", "Amount", "Frequency", "Date", "Shared", "Notes"])
        for e in entries:
            writer.writerow([
                e.id, e.type, e.category, e.description,
                f"{e.amount:.2f}", e.frequency, e.date,
                "Yes" if e.shared else "No", e.notes or "",
            ])

    elif export_type == "documents":
        result = await db.execute(select(Document).where(Document.user_id == user_id).order_by(Document.upload_date.desc()))
        docs = result.scalars().all()
        writer = csv.writer(output)
        writer.writerow(["ID", "Name", "Category", "File Type", "File Size (KB)", "Status", "Favorite", "Upload Date", "Description"])
        for d in docs:
            writer.writerow([
                d.id, d.name, d.category, d.file_type,
                f"{d.file_size / 1024:.1f}",
                d.status, "Yes" if d.is_favorite else "No",
                d.upload_date.strftime("%Y-%m-%d") if d.upload_date else "",
                d.description or "",
            ])

    csv_bytes = output.getvalue().encode("utf-8")
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="smart-split-{export_type}-{_now_str()}.csv"',
            "Content-Length": str(len(csv_bytes)),
        },
    )


# ── PDF Export ────────────────────────────────────────────────
@router.get("/pdf/{export_type}")
async def export_pdf(
    export_type: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if export_type not in VALID_TYPES:
        raise HTTPException(status_code=400, detail=f"Unknown type. Valid: {sorted(VALID_TYPES)}")

    try:
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import cm
    except ImportError:
        raise HTTPException(status_code=503, detail="PDF generation requires reportlab. Install it: pip install reportlab")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm, leftMargin=2*cm, rightMargin=2*cm)
    styles = getSampleStyleSheet()
    story = []

    accent = colors.HexColor("#8A7AE6")
    teal = colors.HexColor("#5AAE9A")
    light_bg = colors.HexColor("#F0EDFF")

    title_style = ParagraphStyle("Title", parent=styles["Heading1"], textColor=accent, fontSize=18, spaceAfter=6)
    sub_style = ParagraphStyle("Sub", parent=styles["Normal"], textColor=colors.HexColor("#777D8B"), fontSize=9, spaceAfter=12)
    body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=9, leading=14)
    head_style = ParagraphStyle("Head", parent=styles["Heading2"], fontSize=11, textColor=accent, spaceBefore=12, spaceAfter=4)

    disclaimer = (
        "This document was generated by Smart Split for personal planning and organization purposes only. "
        "It does not constitute legal, financial, or professional advice. "
        "Always consult a qualified professional before making decisions affecting your legal rights."
    )

    if export_type == "tasks":
        story.append(Paragraph("Smart Split — Task Summary", title_style))
        story.append(Paragraph(f"Generated: {_now_str()} • For your personal use only", sub_style))
        story.append(Spacer(1, 0.3*cm))

        result = await db.execute(select(Task).where(Task.user_id == user_id).order_by(Task.stage, Task.priority))
        tasks = result.scalars().all()

        if not tasks:
            story.append(Paragraph("No tasks found.", body_style))
        else:
            # Group by stage
            stage_map: dict[str, list] = {}
            for t in tasks:
                stage_map.setdefault(t.stage, []).append(t)

            stage_labels = {
                "understand": "1. Understand Your Situation",
                "organize": "2. Organize Information",
                "prepare_financially": "3. Prepare Financially",
                "professional_guidance": "4. Seek Professional Guidance",
                "legal_procedures": "5. Understand Legal Procedures",
                "parenting": "6. Parenting Arrangements",
                "track_proceedings": "7. Track Proceedings",
                "life_after": "8. Plan Life After",
            }
            for stage_id, stage_tasks in stage_map.items():
                story.append(Paragraph(stage_labels.get(stage_id, stage_id), head_style))
                data = [["Title", "Priority", "Status", "Due Date"]]
                for t in stage_tasks:
                    data.append([
                        t.title[:60], t.priority.upper(),
                        "✓" if t.status == "completed" else t.status.replace("_", " ").title(),
                        t.due_date or "—",
                    ])
                tbl = Table(data, colWidths=[10*cm, 2.5*cm, 3*cm, 2.5*cm])
                tbl.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), light_bg),
                    ("TEXTCOLOR", (0, 0), (-1, 0), accent),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8F7F4")]),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E8E7EE")),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]))
                story.append(tbl)
                story.append(Spacer(1, 0.4*cm))

    elif export_type == "finance":
        story.append(Paragraph("Smart Split — Financial Summary", title_style))
        story.append(Paragraph(f"Generated: {_now_str()} • Estimates only — not financial advice", sub_style))
        story.append(Spacer(1, 0.3*cm))

        result = await db.execute(select(FinanceEntry).where(FinanceEntry.user_id == user_id).order_by(FinanceEntry.type, FinanceEntry.category))
        entries = result.scalars().all()

        if not entries:
            story.append(Paragraph("No financial entries found.", body_style))
        else:
            for entry_type in ("income", "expense", "asset", "debt"):
                typed = [e for e in entries if e.type == entry_type]
                if not typed:
                    continue
                story.append(Paragraph(entry_type.upper(), head_style))
                data = [["Category", "Description", "Amount", "Frequency", "Shared"]]
                total = 0.0
                for e in typed:
                    data.append([
                        e.category, e.description[:50],
                        f"${e.amount:,.2f}", e.frequency.replace("_", " ").title(),
                        "Shared" if e.shared else "",
                    ])
                    if entry_type in ("income", "expense") and e.frequency == "monthly":
                        total += e.amount
                    elif entry_type in ("asset", "debt"):
                        total += e.amount
                # Totals row
                data.append(["", "TOTAL", f"${total:,.2f}", "", ""])
                tbl = Table(data, colWidths=[3.5*cm, 7*cm, 3*cm, 3*cm, 1.5*cm])
                tbl.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), light_bg),
                    ("TEXTCOLOR", (0, 0), (-1, 0), accent),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#F8F7F4")]),
                    ("BACKGROUND", (0, -1), (-1, -1), light_bg),
                    ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E8E7EE")),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]))
                story.append(tbl)
                story.append(Spacer(1, 0.4*cm))

    elif export_type == "documents":
        story.append(Paragraph("Smart Split — Document Inventory", title_style))
        story.append(Paragraph(f"Generated: {_now_str()} • Personal record only", sub_style))
        story.append(Spacer(1, 0.3*cm))

        result = await db.execute(select(Document).where(Document.user_id == user_id).order_by(Document.category, Document.upload_date.desc()))
        docs = result.scalars().all()

        if not docs:
            story.append(Paragraph("No documents found.", body_style))
        else:
            data = [["Name", "Category", "Type", "Size", "Status", "Uploaded"]]
            for d in docs:
                data.append([
                    d.name[:45], d.category.replace("_", " ").title(),
                    d.file_type.upper(), f"{d.file_size/1024:.1f} KB",
                    d.status.title(), d.upload_date.strftime("%d %b %Y") if d.upload_date else "—",
                ])
            tbl = Table(data, colWidths=[7*cm, 3*cm, 1.5*cm, 2*cm, 2*cm, 2.5*cm])
            tbl.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), light_bg),
                ("TEXTCOLOR", (0, 0), (-1, 0), accent),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8F7F4")]),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E8E7EE")),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            story.append(tbl)

    # Disclaimer footer
    story.append(Spacer(1, 0.8*cm))
    story.append(Paragraph(disclaimer, ParagraphStyle("Disc", parent=styles["Normal"],
        fontSize=7, textColor=colors.HexColor("#777D8B"), leading=10)))

    doc.build(story)
    pdf_bytes = buffer.getvalue()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="smart-split-{export_type}-{_now_str()}.pdf"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )
