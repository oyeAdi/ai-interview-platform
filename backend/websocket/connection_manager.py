"""WebSocket connection management with channels"""
from typing import Dict, Set, Optional
from fastapi import WebSocket

class ConnectionManager:
    """Manages WebSocket connections with separate channels and tenant isolation"""
    
    def __init__(self):
        # Format: {tenant_id: set(WebSocket)}
        self.admin_connections: Dict[str, Set[WebSocket]] = {}
        self.candidate_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, view: str, tenant_id: str = "global"):
        """Connect WebSocket to appropriate channel and tenant"""
        await websocket.accept()
        
        # Initialize tenant sets if they don't exist
        if tenant_id not in self.admin_connections:
            self.admin_connections[tenant_id] = set()
        if tenant_id not in self.candidate_connections:
            self.candidate_connections[tenant_id] = set()
            
        # Expert view is treated as admin (receives all admin messages)
        if view == "admin" or view == "expert":
            self.admin_connections[tenant_id].add(websocket)
        else:
            self.candidate_connections[tenant_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, view: str, tenant_id: str = "global"):
        """Disconnect WebSocket from channel and tenant"""
        if tenant_id in self.admin_connections:
            if view == "admin" or view == "expert":
                self.admin_connections[tenant_id].discard(websocket)
            else:
                self.candidate_connections[tenant_id].discard(websocket)
    
    async def send_to_candidate(self, message: Dict, tenant_id: str = "global"):
        """Send message to all candidate connections for a specific tenant"""
        if tenant_id not in self.candidate_connections:
            return
            
        disconnected = set()
        for connection in list(self.candidate_connections[tenant_id]):
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)
        
        # Remove disconnected connections
        for conn in disconnected:
            self.candidate_connections[tenant_id].discard(conn)
    
    async def send_to_admin(self, message: Dict, tenant_id: str = "global"):
        """Send message to all admin connections for a specific tenant"""
        if tenant_id not in self.admin_connections:
            return
            
        disconnected = set()
        for connection in list(self.admin_connections[tenant_id]):
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)
        
        # Remove disconnected connections
        for conn in disconnected:
            self.admin_connections[tenant_id].discard(conn)
    
    async def broadcast(self, message: Dict, view: Optional[str] = None, tenant_id: str = "global"):
        """Broadcast message to connections for a specific tenant and optional view"""
        if view == "admin":
            await self.send_to_admin(message, tenant_id)
        elif view == "candidate":
            await self.send_to_candidate(message, tenant_id)
        else:
            # Send to both
            await self.send_to_candidate(message, tenant_id)
            await self.send_to_admin(message, tenant_id)

