import { Children, createContext, useCallback, useContext, useRef, useState } from "react";
import { getItemAsync } from '@/deps/secureStorage'


const devLog = (...args: any) => {
    if (__DEV__) console.log(...args)
}


const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }: any) => {
    const [conectionStatus, setConnectionStatus] = useState('disconnected')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const wsRef = useRef(null)
    const messageHandlersRef = useRef(new Map())
    const reconnectTimeoutRef = useRef(null)

    const connect = useCallback(async () => {
        const token = await getItemAsync('ACCESS_TOKEN')
        if (!token) {
            devLog('no auth token. skipping websocket conn.')
            setIsAuthenticated(false)
            return
        }

        setIsAuthenticated(true)

        // if (wsRef.current?.readyState === WebSocket.OPEN) {
        //     devLog('already connected')
        //     return
        // }

        devLog('connecting to web socket')
        const ws = new WebSocket('wss://ufinda-v0-01.onrender.com/ws/chat')

        ws.onopen = () => {
            devLog('✅ WebSocket connected')
            setConnectionStatus('connected')
        }

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            devLog('received:', data.type)

            if (data.type === 'new_message') {
                const msg = data.payload
                const handler = messageHandlersRef.current.get(msg.chat_room_id)

                if (handler) {
                    handler(msg)
                    devLog('delivered to active room')
                } else {
                    devLog('backend will push notifications')
                }

            } else if (data.type === 'message_delivered') {
                devLog('message delivered')
            }
        }

        ws.onerror = (error) => {
            devLog('websocket error', error)
            setConnectionStatus('error')
        }

        ws.close = () => {
            devLog('websocket closed')
            setConnectionStatus('disconnected')
        }

        // reconnectTimeoutRef.current = setTimeout(async )
    }, [])



}





