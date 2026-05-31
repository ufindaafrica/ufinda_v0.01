import { getNewTokens } from "@/services/refreshToken";
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

            ws.onclose = async (event) => {
                console.log("🔌 Disconnected", event.code)

                // if auth error, try to get new access token
                if (event.code === 1008 || event.code === 4001) {
                    console.log("🔄 Auth error, refreshing token...")
                    const refreshed = await getNewTokens()

                    if (refreshed) {
                        console.log("✅ Token refreshed, reconnecting...")
                        connect()
                    }

                    // if refresh failed, getNewTokens() already redirects to login
                    return
                }

                // any other disconnect not connected to auth error, reconnect after 3 seconds
                setTimeout(() => {
                    console.log("🔄 Reconnecting to websocket...")
                    connect()
                }, 3000)
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

