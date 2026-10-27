"""Smart Split — Finance API (entries + scenarios)"""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.models.database import get_db
from app.models.models import FinanceEntry, FinancialScenario
from app.core.security import get_current_user_id

router = APIRouter(prefix="/finance", tags=["finance"])

# ── Entry schemas ─────────────────────────────────────────────
class FinanceCreate(BaseModel):
    type: str
    category: str
    description: str
    amount: float
    frequency: str
    date: str
    notes: Optional[str] = None
    shared: bool = False

class FinancePatch(BaseModel):
    type: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    frequency: Optional[str] = None
    date: Optional[str] = None
    notes: Optional[str] = None
    shared: Optional[bool] = None

def entry_to_dict(e: FinanceEntry) -> dict:
    return {
        "id": e.id, "user_id": e.user_id, "type": e.type,
        "category": e.category, "description": e.description,
        "amount": e.amount, "frequency": e.frequency,
        "date": e.date, "notes": e.notes, "shared": e.shared,
    }

# ── Entry endpoints ───────────────────────────────────────────
@router.get("")
async def list_entries(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FinanceEntry).where(FinanceEntry.user_id == user_id))
    return [entry_to_dict(e) for e in result.scalars().all()]

@router.post("", status_code=201)
async def create_entry(req: FinanceCreate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    entry = FinanceEntry(id=str(uuid.uuid4()), user_id=user_id, **req.model_dump())
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry_to_dict(entry)

@router.patch("/{entry_id}")
async def update_entry(entry_id: str, req: FinancePatch, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FinanceEntry).where(FinanceEntry.id == entry_id, FinanceEntry.user_id == user_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    for field, value in req.model_dump(exclude_none=True).items():
        setattr(entry, field, value)
    await db.commit()
    return entry_to_dict(entry)

@router.delete("/{entry_id}", status_code=204)
async def delete_entry(entry_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FinanceEntry).where(FinanceEntry.id == entry_id, FinanceEntry.user_id == user_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    await db.delete(entry)
    await db.commit()

# ── Scenario schemas ──────────────────────────────────────────
class ScenarioCreate(BaseModel):
    name: str
    description: Optional[str] = None
    entries: list = []  # list of FinancialEntry-like dicts

class ScenarioPatch(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    entries: Optional[list] = None

def scenario_to_dict(s: FinancialScenario) -> dict:
    return {
        "id": s.id, "user_id": s.user_id, "name": s.name,
        "description": s.description, "entries": s.entries or [],
        "created_at": s.created_at.isoformat(),
        "updated_at": s.updated_at.isoformat(),
    }

# ── Scenario endpoints ────────────────────────────────────────
@router.get("/scenarios")
async def list_scenarios(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(FinancialScenario).where(FinancialScenario.user_id == user_id)
        .order_by(FinancialScenario.created_at.desc())
    )
    return [scenario_to_dict(s) for s in result.scalars().all()]

@router.post("/scenarios", status_code=201)
async def create_scenario(req: ScenarioCreate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    scenario = FinancialScenario(
        id=str(uuid.uuid4()), user_id=user_id,
        name=req.name[:256], description=req.description,
        entries=req.entries,
    )
    db.add(scenario)
    await db.commit()
    await db.refresh(scenario)
    return scenario_to_dict(scenario)

@router.patch("/scenarios/{scenario_id}")
async def update_scenario(scenario_id: str, req: ScenarioPatch, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(FinancialScenario).where(FinancialScenario.id == scenario_id, FinancialScenario.user_id == user_id)
    )
    scenario = result.scalar_one_or_none()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    for field, value in req.model_dump(exclude_none=True).items():
        setattr(scenario, field, value)
    await db.commit()
    return scenario_to_dict(scenario)

@router.delete("/scenarios/{scenario_id}", status_code=204)
async def delete_scenario(scenario_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(FinancialScenario).where(FinancialScenario.id == scenario_id, FinancialScenario.user_id == user_id)
    )
    scenario = result.scalar_one_or_none()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    await db.delete(scenario)
    await db.commit()
