import { getItemAsync } from "expo-secure-store";
import { createContext, useContext, useEffect, useRef } from "react";


interface WebSocketContextType { }

const WebSocketContext = createContext<WebSocketContextType>({})

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {

    const wsRef = useRef<WebSocket | null>(null)

    useEffect(() => {

        const connect = async () => {
            console.log("getting access token...")

            const token = await getItemAsync('ACCESS_TOKEN')

            if (!token) {
                console.log("no token found, skipping connection")
                return
            }

            console.log("connecting to websocket...")

            const ws = new WebSocket(`wss://ufinda-v0-01.onrender.com/ws/chat?token=${token}`)

            ws.onopen = () => {
                console.log("✅ Connected")
            }

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data)
                console.log("📨 Message received:", data)
            }

            ws.onerror = (error) => {
                console.log("❌ Error:", error)
            }

            ws.onclose = () => {
                console.log("🔌 Disconnected")
            }

            wsRef.current = ws
        }

        connect()

        return () => {
            wsRef.current?.close()
        }
    }, [])

    return (
        <WebSocketContext.Provider value={{}}>
            {children}
        </WebSocketContext.Provider>
    )
}

export const useWebSocket = () => useContext(WebSocketContext)

