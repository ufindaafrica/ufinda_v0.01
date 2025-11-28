import { BARE_URL, BASE_URL } from "./apiConstants"


export const kycWebSocket = (vendorId: string) => {
    let timeout: any
    let ws: WebSocket | null = null

    const promise = new Promise((resolve, reject) => {
        try {
            ws = new WebSocket(`ws://${BARE_URL}/ws?user_id=${vendorId}`);
        } catch (e) {
            console.log("WebSocket failed to construct:", e);
            reject(e);
            return;
        }

        console.log("loader: verifying kyc")

        ws.onopen = () => {
            console.log("web socket connected, awaiting results")
        }

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            console.log("kyc update received:", data)
            clearTimeout(timeout)
            ws?.close()
            resolve(data)
        }

        ws.onerror = (err) => {
            console.log("websocket error:", err)
            clearTimeout(timeout)
            ws?.close()
            reject(err)
        }

        ws.onclose = () => {
            console.log("websocket connection closed")
        }

        timeout = setTimeout(() => {
            console.log("websocket time out")
            ws?.close()
            reject(new Error("timeout"))
        }, 20000)
    })

    return {
        promise,
        cancel: () => {
            timeout && clearTimeout(timeout)
            if (ws && ws.readyState === WebSocket.OPEN) ws.close()
            ws = null
        }
    }
}
