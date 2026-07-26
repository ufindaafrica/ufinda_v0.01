import { verticalScale } from "@/deps/scale"
import { useRef, useState } from "react"
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from "react-native"
import { WebView } from "react-native-webview"


type KycWebViewProps = {
    url: string,
    onComplete: () => void,
    onCancel?: () => void
}

export default function KycWebView({ url, onComplete, onCancel }: KycWebViewProps) {
    const [loading, setLoading] = useState(true)
    const [visible, setVisible] = useState(true)
    const webViewRef = useRef<WebView>(null)

    const handleMessage = (event: any) => {
        console.log("WebView message: On receive message", event.nativeEvent.data)
        if (event.nativeEvent.data === "KYC_DONE") {
            setVisible(false)
            onComplete()
        }
    }

    const handleNavigationStateChange = (navState: any) => {
        console.log("WebView nav: On handleNavigationchange", navState.url)
        if (navState.url.includes("https://www.ufinda.org/")) {
            setVisible(false)
            onComplete()
        }
        // setVisible(false)
        // onComplete()
    }


    return (
        <View style={{ width: "90%", height: "95%" }}>
            <Modal visible={visible} animationType="slide" transparent={true}>
                <View style={{ flex: 1, alignSelf: "center", width: "100%", justifyContent: "center", alignItems: 'center' }}>
                    <View style={{width: "90%", height: "80%"}}>
                        {
                            loading && (
                                <ActivityIndicator
                                    size={"large"}
                                    color={"#008000"}
                                    style={{ position: "absolute", top: "50%", left: "50%" }} />
                            )
                        }
                        <WebView
                            ref={webViewRef}
                            style={{
                                flex: 1
                            }}
                            source={{ uri: url }}
                            onLoadEnd={() => setLoading(false)}
                            onMessage={handleMessage}
                            onNavigationStateChange={handleNavigationStateChange} />
                        <TouchableOpacity
                            onPress={() => {
                                setVisible(false)
                                onCancel?.()
                            }}
                            style={{width: "100%",height: verticalScale(44), backgroundColor: "#008000", alignItems: "center", justifyContent: 'center'}}
                        ><Text style={{color: "#ffffff"}}>CANCEL VERIFICATION</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    )
}
