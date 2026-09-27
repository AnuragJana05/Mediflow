from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.manager import manager
import json

router = APIRouter(tags=["WebSocket"])

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    # Send initial connection confirmation
    await websocket.send_text(json.dumps({
        "type": "CONNECTION_ESTABLISHED",
        "message": "Connected to MediFlow Real-Time Operations Telemetry stream"
    }))
    try:
        while True:
            data = await websocket.receive_text()
            # If client sends ping or message, respond with pong
            try:
                msg = json.loads(data)
                if msg.get("type") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
