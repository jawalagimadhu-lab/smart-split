"""Smart Split — Tasks API"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.models.database import get_db
from app.models.models import Task
from app.core.security import get_current_user_id
import uuid

router = APIRouter(prefix="/tasks", tags=["tasks"])


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    stage: str
    category: str
    priority: str = "medium"
    due_date: Optional[str] = None
    notes: Optional[str] = None
    tags: list[str] = []


class TaskPatch(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    stage: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None
    completed_at: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[list[str]] = None


def task_to_dict(t: Task) -> dict:
    return {
        "id": t.id, "user_id": t.user_id, "title": t.title,
        "description": t.description, "stage": t.stage,
        "category": t.category, "priority": t.priority,
        "status": t.status, "due_date": t.due_date,
        "completed_at": t.completed_at, "notes": t.notes, "tags": t.tags or [],
    }


@router.get("")
async def list_tasks(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.user_id == user_id))
    return [task_to_dict(t) for t in result.scalars().all()]


@router.post("", status_code=201)
async def create_task(req: TaskCreate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    task = Task(id=str(uuid.uuid4()), user_id=user_id, **req.model_dump(), status="pending")
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task_to_dict(task)


@router.patch("/{task_id}")
async def update_task(task_id: str, req: TaskPatch, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for field, value in req.model_dump(exclude_none=True).items():
        setattr(task, field, value)
    await db.commit()
    return task_to_dict(task)


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
    await db.commit()


# Suggested task templates per separation stage
_SUGGESTED_TASKS: dict[str, list[dict]] = {
    "exploring": [
        {"title": "Research the divorce process in your country", "stage": "understand", "category": "Legal", "priority": "medium"},
        {"title": "Understand the difference between separation and divorce", "stage": "understand", "category": "Legal", "priority": "medium"},
        {"title": "Write down your main concerns and priorities", "stage": "understand", "category": "Personal", "priority": "low"},
    ],
    "considering": [
        {"title": "Consult a family lawyer for an initial overview", "stage": "professional_guidance", "category": "Legal", "priority": "high"},
        {"title": "Research mediation as an alternative to court", "stage": "understand", "category": "Legal", "priority": "medium"},
        {"title": "Create a list of shared assets and debts", "stage": "organize", "category": "Finance", "priority": "high"},
    ],
    "recently_separated": [
        {"title": "Open a personal bank account if you don't have one", "stage": "prepare_financially", "category": "Finance", "priority": "high"},
        {"title": "Gather all important identity documents", "stage": "organize", "category": "Documents", "priority": "high"},
        {"title": "Locate and copy financial documents (3 years bank statements, tax returns)", "stage": "organize", "category": "Documents", "priority": "high"},
        {"title": "Review joint account access and credit cards", "stage": "prepare_financially", "category": "Finance", "priority": "high"},
        {"title": "Schedule a consultation with a family solicitor", "stage": "professional_guidance", "category": "Legal", "priority": "high"},
    ],
    "preparing_divorce": [
        {"title": "Complete financial disclosure documents", "stage": "legal_procedures", "category": "Legal", "priority": "urgent"},
        {"title": "Organize property valuation documents", "stage": "organize", "category": "Documents", "priority": "high"},
        {"title": "Create a post-separation budget", "stage": "prepare_financially", "category": "Finance", "priority": "high"},
        {"title": "Research housing options and costs", "stage": "life_after", "category": "Housing", "priority": "medium"},
        {"title": "Prepare mediation discussion points", "stage": "legal_procedures", "category": "Legal", "priority": "medium"},
    ],
    "proceedings_underway": [
        {"title": "Keep a record of all legal correspondence", "stage": "track_proceedings", "category": "Legal", "priority": "high"},
        {"title": "Note all important court dates and deadlines", "stage": "track_proceedings", "category": "Legal", "priority": "urgent"},
        {"title": "Review draft consent order with your solicitor", "stage": "legal_procedures", "category": "Legal", "priority": "high"},
        {"title": "Arrange childcare or co-parenting schedule proposal", "stage": "parenting", "category": "Parenting", "priority": "high"},
    ],
    "finalizing": [
        {"title": "Review final financial settlement documents carefully", "stage": "legal_procedures", "category": "Legal", "priority": "urgent"},
        {"title": "Update your will and beneficiary designations", "stage": "life_after", "category": "Admin", "priority": "high"},
        {"title": "Plan address change notifications", "stage": "life_after", "category": "Admin", "priority": "medium"},
        {"title": "Review pension and retirement arrangements", "stage": "prepare_financially", "category": "Finance", "priority": "high"},
    ],
    "rebuilding": [
        {"title": "Update all accounts with new address", "stage": "life_after", "category": "Admin", "priority": "medium"},
        {"title": "Create a new personal budget", "stage": "prepare_financially", "category": "Finance", "priority": "medium"},
        {"title": "Set personal goals for the next 6 months", "stage": "life_after", "category": "Personal", "priority": "low"},
        {"title": "Explore career or education opportunities if relevant", "stage": "life_after", "category": "Personal", "priority": "low"},
    ],
}


@router.get("/suggest")
async def suggest_tasks(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Return task suggestions based on the user's separation stage."""
    from app.models.models import User
    from sqlalchemy import select as sa_select
    user_result = await db.execute(sa_select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        return []
    stage = (user.preferences or {}).get("separation_stage", "exploring")
    suggestions = _SUGGESTED_TASKS.get(stage, _SUGGESTED_TASKS["exploring"])
    # Return with generated IDs so frontend can present them
    return [{"id": str(uuid.uuid4()), "user_id": user_id, **s, "status": "pending", "tags": []} for s in suggestions]
