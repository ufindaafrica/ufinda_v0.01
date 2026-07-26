import { getNewTokens } from "@/services/refreshToken";
import { getItemAsync } from "expo-secure-store";
import { createContext, useContext, useEffect, useRef } from "react";


interface WebSocketContextType {
    joinRoom: (roomId: string, onMessage: (msg: any) => void) => void;
    leaveRoom: (roomId: string) => void;
    sendMessage: (roomId: string, content: string, messageType?: string, publicId?: string) => void
}

const WebSocketContext = createContext<WebSocketContextType>({
    joinRoom: () => {},
    leaveRoom: () => {},
    sendMessage: () => {}
})

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {

    const wsRef = useRef<WebSocket | null>(null)
    const messageHandlersRef = useRef<Map<string, (msg: any) => void>>(new Map())

    useEffect(() => {

        const connect = async () => {
            console.log("getting access token...")

            const token = await getItemAsync('ACCESS_TOKEN')

            if (!token) {
                // console.log("no token found, skipping connection")
                console.log("no token found")
                // return
            }

            console.log("connecting to websocket...")

            const ws = new WebSocket(`wss://ufinda-v0-01.onrender.com/ws/chat?token=${token}`)

            ws.onopen = () => {
                console.log("✅ Connected")
            }

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data)
                console.log("📨 Message received:", data)

                if (data.type === "new_message") {
                    const msg = data.payload
                    const handler = messageHandlersRef.current.get(msg.chat_room_id);
                    if (handler) handler(msg)
                }
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
                }, 7000)
            }

            wsRef.current = ws
        }

        connect()

        return () => {
            wsRef.current?.close()
        }
    }, [])

    const joinRoom = (roomId: string, onMessage: (msg: any) => void) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: "join_room",
                payload: { room_id: roomId }
            }))
            messageHandlersRef.current.set(roomId, onMessage)
            console.log("📥 Joined room:", roomId)
        }
    }

    const leaveRoom = (roomId: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: "leave_room",
                payload: { room_id: roomId }
            }))
            messageHandlersRef.current.delete(roomId)
            console.log("📤 Left room:", roomId)
        }
    }

    const sendMessage = (roomId: string, content: string, messageType: string = "text", publicId?: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: "message",
                payload: {
                    room_id: roomId,
                    content,
                    message_type: messageType,
                    ...(publicId && { public_id: publicId })
                }
            }))
            console.log("📤 Sent message")
        }
    }

    return (
        <WebSocketContext.Provider value={{ joinRoom, leaveRoom, sendMessage }}>
            {children}
        </WebSocketContext.Provider>
    )
}

export const useWebSocket = () => useContext(WebSocketContext)

