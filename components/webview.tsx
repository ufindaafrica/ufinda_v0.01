import { useRef, useState } from "react"
import { ActivityIndicator, Button, Modal, View } from "react-native"
import { WebView } from "react-native-webview"


type KycWebViewProps = {
    url: string,
    onComplete: () => void,
    onCancel?: () => void
}

export default function KycWebView ({ url, onComplete, onCancel } : KycWebViewProps) {
    const [loading, setLoading] = useState(true)
    const [visible, setVisible] = useState(true)
    const webViewRef = useRef<WebView>(null)

    const handleMessage = (event: any) => {
         console.log("WebView message:", event.nativeEvent.data)
        if (event.nativeEvent.data === "KYC_DONE") {
            setVisible(false)
            onComplete()
        }
    }

    const handleNavigationStateChange = (navState: any) => {
        console.log("WebView nav:", navState.url)
        if (navState.url.includes('success')) {
            setVisible(false)
            onComplete()
        }
    }


    return (
        <Modal visible={visible} animationType="slide">
            <View style={{flex: 1}}>
                {
                    loading && (
                        <ActivityIndicator 
                            size={"large"}
                            color={"#0000ff"}
                            style={{ position: "absolute", top: "50%", left: "50%"}}/>
                    )
                }
                <WebView
                    ref={webViewRef}
                    source={{ uri: url }}
                    onLoadEnd={() => setLoading(false)}
                    onMessage={handleMessage}
                    onNavigationStateChange={handleNavigationStateChange} />
                <Button
                    title="Cancel Verification"
                    onPress={() => {
                        setVisible(false)
                        onCancel?.()
                    }} />
            </View>
        </Modal>
    )
}
