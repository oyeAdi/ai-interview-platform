import { useEffect, useRef, useState } from 'react'

export function useWebSocket(url: string, view: string) {
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const websocket = new WebSocket(`${url}?view=${view}`)
    
    websocket.onopen = () => {
      setWs(websocket)
      wsRef.current = websocket
      setConnected(true)
    }

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
      setConnected(false)
    }

    websocket.onclose = () => {
      setWs(null)
      wsRef.current = null
      setConnected(false)
    }

    return () => {
      websocket.close()
    }
  }, [url, view])

  const send = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }

  return { ws, connected, send }
}





