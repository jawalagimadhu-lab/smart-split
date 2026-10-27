"""Smart Split — Calendar API"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.models.database import get_db
from app.models.models import CalendarEvent
from app.core.security import get_current_user_id
import uuid

router = APIRouter(prefix="/calendar", tags=["calendar"])


class EventCreate(BaseModel):
    title: str
    type: str
    date: str
    end_date: Optional[str] = None
    description: Optional[str] = None
    reminder: bool = False
    color: Optional[str] = None


class EventPatch(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None
    reminder: Optional[bool] = None


def event_to_dict(e: CalendarEvent) -> dict:
    return {
        "id": e.id, "title": e.title, "type": e.type,
        "date": e.date, "end_date": e.end_date,
        "description": e.description, "reminder": e.reminder, "color": e.color,
    }


@router.get("")
async def list_events(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CalendarEvent).where(CalendarEvent.user_id == user_id).order_by(CalendarEvent.date))
    return [event_to_dict(e) for e in result.scalars().all()]


@router.post("", status_code=201)
async def create_event(req: EventCreate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    event = CalendarEvent(id=str(uuid.uuid4()), user_id=user_id, **req.model_dump())
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event_to_dict(event)


@router.patch("/{event_id}")
async def update_event(event_id: str, req: EventPatch, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CalendarEvent).where(CalendarEvent.id == event_id, CalendarEvent.user_id == user_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for field, value in req.model_dump(exclude_none=True).items():
        setattr(event, field, value)
    await db.commit()
    return event_to_dict(event)


@router.delete("/{event_id}", status_code=204)
async def delete_event(event_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CalendarEvent).where(CalendarEvent.id == event_id, CalendarEvent.user_id == user_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.delete(event)
    await db.commit()
