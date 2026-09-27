from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from app.websocket.manager import manager
import asyncio

def log_action(
    db: Session,
    action: str,
    entity: str,
    entity_id: str,
    user_id: int = None,
    user_name: str = "System",
    user_role: str = "system",
    old_value: str = None,
    new_value: str = None,
    details: str = None
) -> AuditLog:
    log = AuditLog(
        user_id=user_id,
        user_name=user_name,
        user_role=user_role,
        action=action,
        entity=entity,
        entity_id=entity_id,
        old_value=old_value,
        new_value=new_value,
        details=details
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    
    # Broadcast audit event via websocket in background
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(manager.broadcast({
                "type": "AUDIT_LOG_CREATED",
                "data": {
                    "id": log.id,
                    "action": log.action,
                    "entity": log.entity,
                    "entity_id": log.entity_id,
                    "user_name": log.user_name,
                    "user_role": log.user_role,
                    "timestamp": log.timestamp.isoformat()
                }
            }))
    except Exception:
        pass

    return log
