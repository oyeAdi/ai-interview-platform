"""WebSocket connection management with channels"""
from typing import Dict, Set, Optional
from fastapi import WebSocket

class ConnectionManager:
    """Manages WebSocket connections with separate channels"""
    
    def __init__(self):
        self.admin_connections: Set[WebSocket] = set()
        self.candidate_connections: Set[WebSocket] = set()
    
    async def connect(self, websocket: WebSocket, view: str):
        """Connect WebSocket to appropriate channel"""
        await websocket.accept()
        
        # Expert view is treated as admin (receives all admin messages)
        if view == "admin" or view == "expert":
            self.admin_connections.add(websocket)
        else:
            self.candidate_connections.add(websocket)
    
    def disconnect(self, websocket: WebSocket, view: str):
        """Disconnect WebSocket from channel"""
        if view == "admin" or view == "expert":
            self.admin_connections.discard(websocket)
        else:
            self.candidate_connections.discard(websocket)
    
    async def send_to_candidate(self, message: Dict):
        """Send message to all candidate connections"""
        disconnected = set()
        for connection in self.candidate_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)
        
        # Remove disconnected connections
        for conn in disconnected:
            self.candidate_connections.discard(conn)
    
    async def send_to_admin(self, message: Dict):
        """Send message to all admin connections"""
        disconnected = set()
        for connection in self.admin_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)
        
        # Remove disconnected connections
        for conn in disconnected:
            self.admin_connections.discard(conn)
    
    async def broadcast(self, message: Dict, view: Optional[str] = None):
        """Broadcast message to all connections or specific view"""
        if view == "admin":
            await self.send_to_admin(message)
        elif view == "candidate":
            await self.send_to_candidate(message)
        else:
            # Send to both
            await self.send_to_candidate(message)
            await self.send_to_admin(message)

