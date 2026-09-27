from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogResponse

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    entity: Optional[str] = None,
    action: Optional[str] = None,
    user_role: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if entity:
        query = query.filter(AuditLog.entity == entity)
    if action:
        query = query.filter(AuditLog.action == action)
    if user_role:
        query = query.filter(AuditLog.user_role == user_role)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (AuditLog.details.ilike(search_fmt)) |
            (AuditLog.entity_id.ilike(search_fmt)) |
            (AuditLog.user_name.ilike(search_fmt))
        )
    
    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return logs
