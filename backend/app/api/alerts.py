from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional, List

from app.core.database import get_db
from app.models.alert import Alert, AlertStatus
from app.models.user import User
from app.schemas.alert import AlertResponse, AlertAcknowledgeRequest
from app.api.deps import get_current_user
from app.services.alert_service import check_and_update_alerts
from app.websocket.manager import manager
import asyncio

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity_filter: Optional[str] = Query(None, alias="severity"),
    db: Session = Depends(get_db)
):
    check_and_update_alerts(db)
    query = db.query(Alert)
    if status_filter:
        query = query.filter(Alert.status == status_filter)
    if severity_filter:
        query = query.filter(Alert.severity == severity_filter)
    
    # Sort: Active first, then Critical first, then by created_at desc
    severity_order = {"Critical": 1, "High": 2, "Medium": 3, "Info": 4}
    status_order = {"Active": 1, "Acknowledged": 2, "Resolved": 3}
    
    alerts = query.all()
    alerts.sort(key=lambda a: (
        status_order.get(a.status, 4),
        severity_order.get(a.severity, 5),
        -a.created_at.timestamp() if a.created_at else 0
    ))

    results = []
    for a in alerts:
        results.append(AlertResponse(
            id=a.id,
            type=a.type,
            severity=a.severity,
            title=a.title,
            message=a.message,
            department=a.department,
            status=a.status,
            created_at=a.created_at,
            acknowledged_at=a.acknowledged_at,
            acknowledged_by_id=a.acknowledged_by_id,
            acknowledged_by_name=a.acknowledged_by.name if a.acknowledged_by else None
        ))
    return results

@router.post("/{id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    id: int,
    payload: AlertAcknowledgeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = AlertStatus.ACKNOWLEDGED.value
    alert.acknowledged_at = datetime.now(timezone.utc)
    alert.acknowledged_by_id = current_user.id
    db.commit()
    db.refresh(alert)

    # Broadcast websocket update
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(manager.broadcast({
                "type": "ALERT_ACKNOWLEDGED",
                "data": {"alert_id": alert.id, "acknowledged_by": current_user.name}
            }))
    except Exception:
        pass

    return AlertResponse(
        id=alert.id,
        type=alert.type,
        severity=alert.severity,
        title=alert.title,
        message=alert.message,
        department=alert.department,
        status=alert.status,
        created_at=alert.created_at,
        acknowledged_at=alert.acknowledged_at,
        acknowledged_by_id=alert.acknowledged_by_id,
        acknowledged_by_name=current_user.name
    )
