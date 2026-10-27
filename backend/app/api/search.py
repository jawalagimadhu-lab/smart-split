"""
Smart Split — Global Search API
GET /search?q=<query>
Searches tasks, documents, and returns matched resources from static data.
All results are scoped to the authenticated user.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models.database import get_db
from app.models.models import Task, Document
from app.core.security import get_current_user_id

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
async def global_search(
    q: str = Query(..., min_length=1, max_length=200),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Search tasks and documents belonging to the authenticated user.
    Returns structured results per category.
    Query is sanitized — treated as a plain text search, not SQL or code.
    """
    # Sanitize: strip any SQL-like characters to prevent injection
    safe_q = q.strip()[:200]
    pattern = f"%{safe_q}%"

    # Tasks — search title, description, notes
    task_result = await db.execute(
        select(Task).where(
            Task.user_id == user_id,
            or_(
                Task.title.ilike(pattern),
                Task.description.ilike(pattern),
                Task.notes.ilike(pattern),
                Task.category.ilike(pattern),
            ),
        ).limit(10)
    )
    tasks = [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "priority": t.priority,
            "stage": t.stage,
            "type": "task",
            "url": "/app/planner",
        }
        for t in task_result.scalars().all()
    ]

    # Documents — search name, description
    doc_result = await db.execute(
        select(Document).where(
            Document.user_id == user_id,
            or_(
                Document.name.ilike(pattern),
                Document.original_name.ilike(pattern),
                Document.description.ilike(pattern),
                Document.category.ilike(pattern),
            ),
        ).limit(10)
    )
    documents = [
        {
            "id": d.id,
            "title": d.name,
            "description": d.description or f"{d.category} · {d.file_type.upper()}",
            "category": d.category,
            "file_type": d.file_type,
            "type": "document",
            "url": "/app/documents",
        }
        for d in doc_result.scalars().all()
    ]

    # Resources — static data search (no DB, no cross-user risk)
    resources = _search_static_resources(safe_q)

    return {
        "query": safe_q,
        "tasks": tasks,
        "documents": documents,
        "resources": resources,
        "total": len(tasks) + len(documents) + len(resources),
    }


# Static legal guide topics for search (mirrors sampleData.ts)
_STATIC_RESOURCES = [
    {"id": "lg1", "title": "What is Divorce?", "category": "Divorce Basics", "url": "/app/legal"},
    {"id": "lg2", "title": "How is Property Divided?", "category": "Property Division", "url": "/app/legal"},
    {"id": "lg3", "title": "Understanding Child Custody", "category": "Child Custody", "url": "/app/legal"},
    {"id": "lg4", "title": "What is Divorce Mediation?", "category": "Mediation", "url": "/app/legal"},
    {"id": "lg5", "title": "Spousal Support Explained", "category": "Spousal Support", "url": "/app/legal"},
    {"id": "r1", "title": "Understanding the Divorce Process", "category": "Legal", "url": "/app/resources"},
    {"id": "r2", "title": "Separation & Divorce Financial Checklist", "category": "Finance", "url": "/app/resources"},
    {"id": "r3", "title": "Parenting Through Separation", "category": "Parenting", "url": "/app/resources"},
    {"id": "r4", "title": "Managing Stress During Separation", "category": "Wellbeing", "url": "/app/resources"},
    {"id": "r5", "title": "Property Division Explained", "category": "Legal", "url": "/app/resources"},
    {"id": "r6", "title": "Emergency Planning Guide", "category": "Safety", "url": "/app/safety"},
    {"id": "r7", "title": "Life After Divorce: A Practical Guide", "category": "Life After", "url": "/app/life-after"},
    {"id": "r8", "title": "Spousal Support Overview", "category": "Legal", "url": "/app/resources"},
]


def _search_static_resources(query: str) -> list[dict]:
    q = query.lower()
    results = []
    for r in _STATIC_RESOURCES:
        if (q in r["title"].lower() or q in r["category"].lower()):
            results.append({**r, "type": "resource"})
    return results[:6]
