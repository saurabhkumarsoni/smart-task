import asyncio
from collections import defaultdict
from typing import Any
from uuid import UUID

from fastapi import WebSocket


class NotificationConnectionManager:
    """In-process websocket manager for authenticated notification streams."""

    def __init__(self) -> None:
        self._connections: dict[
            UUID, set[tuple[WebSocket, asyncio.AbstractEventLoop]]
        ] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, user_id: UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[user_id].add((websocket, asyncio.get_running_loop()))

    async def disconnect(self, user_id: UUID, websocket: WebSocket) -> None:
        async with self._lock:
            connections = self._connections.get(user_id)
            if not connections:
                return
            connections = {item for item in connections if item[0] is not websocket}
            if connections:
                self._connections[user_id] = connections
            else:
                self._connections.pop(user_id, None)

    async def _send(self, websocket: WebSocket, payload: dict[str, Any]) -> None:
        try:
            await websocket.send_json(payload)
        except Exception:
            # Dead connections are removed by the websocket endpoint on its next receive cycle.
            pass

    async def broadcast(self, user_id: UUID, payload: dict[str, Any]) -> None:
        async with self._lock:
            targets = list(self._connections.get(user_id, set()))
        if targets:
            await asyncio.gather(*(self._send(ws, payload) for ws, _ in targets))

    def publish_from_sync(self, user_id: UUID, payload: dict[str, Any]) -> None:
        """Publish from synchronous SQLAlchemy services without blocking the request."""
        for websocket, loop in list(self._connections.get(user_id, set())):
            if loop.is_closed():
                continue
            try:
                asyncio.run_coroutine_threadsafe(self._send(websocket, payload), loop)
            except RuntimeError:
                continue


notification_manager = NotificationConnectionManager()
