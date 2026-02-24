from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.database import get_db, Task, Status, Priority, Category

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[str] = Priority.medium
    category: Optional[str] = Category.other
    due_date: Optional[datetime] = None
    tags: Optional[str] = None
    source: Optional[str] = "web"


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    due_date: Optional[datetime] = None
    tags: Optional[str] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    priority: str
    category: str
    source: str
    created_at: datetime
    updated_at: datetime
    due_date: Optional[datetime]
    tags: Optional[str]
    ai_summary: Optional[str]

    class Config:
        from_attributes = True


@router.get("/", response_model=List[TaskResponse])
def list_tasks(
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(Task)

    if status:
        query = query.filter(Task.status == status)
    if category:
        query = query.filter(Task.category == category)
    if priority:
        query = query.filter(Task.priority == priority)
    if search:
        query = query.filter(
            or_(
                Task.title.contains(search),
                Task.description.contains(search),
                Task.tags.contains(search),
            )
        )

    tasks = query.order_by(desc(Task.created_at)).limit(limit).all()
    return tasks


@router.post("/", response_model=TaskResponse)
def create_task(task_data: TaskCreate, db: Session = Depends(get_db)):
    task = Task(**task_data.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_data: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    task.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}


@router.get("/stats/summary")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Task).count()
    by_status = {
        "open": db.query(Task).filter(Task.status == Status.open).count(),
        "in_progress": db.query(Task).filter(Task.status == Status.in_progress).count(),
        "done": db.query(Task).filter(Task.status == Status.done).count(),
        "cancelled": db.query(Task).filter(Task.status == Status.cancelled).count(),
    }
    by_priority = {
        "urgent": db.query(Task).filter(Task.priority == Priority.urgent).count(),
        "high": db.query(Task).filter(Task.priority == Priority.high).count(),
        "medium": db.query(Task).filter(Task.priority == Priority.medium).count(),
        "low": db.query(Task).filter(Task.priority == Priority.low).count(),
    }
    by_category = {}
    for cat in Category:
        count = db.query(Task).filter(Task.category == cat).count()
        if count > 0:
            by_category[cat] = count

    return {
        "total": total,
        "by_status": by_status,
        "by_priority": by_priority,
        "by_category": by_category,
    }
