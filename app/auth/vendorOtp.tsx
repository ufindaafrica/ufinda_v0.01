import BackArrow from "@/components/back";
import Input from "@/components/input";
import Select from "@/components/select";
import { focusNext } from "@/deps/focusNext";
import { globals, roboto } from "@/styles/globals";
import { signupStyles } from "@/styles/signup";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { getVendorOtpUrl } from "@/services/vendorOtpUrl";
import Loader from "@/components/loader";
import ErrorModal from "@/components/errorModal";
import { kycWebSocket } from "@/services/kycWebSocket";
import KycWebView from "@/components/webview";
import { BARE_URL, getAccessToken } from "@/services/apiConstants";


export default function VendorOtp() {

    const [address, setAddress] = useState("")
    const [NIN, setNIN] = useState("")

    const addressRef = useRef<TextInput | null>(null)
    const NINRef = useRef<TextInput | null>(null)
    const scrollRef = useRef<KeyboardAwareScrollView | null>(null)

    const [incomplete, setIncomplete] = useState(true)

    useEffect(() => {
        if (address == "") setIncomplete(true)
        else setIncomplete(false)
    }, [address])

    const closeWebView = () => {
        setShowWebView(false)
        setLoaderVisible(true)
    }

    const cancelVerification = () => {
        setShowWebView(false)
        setLoaderVisible(false)
    }

    const vendorId = "sample"
    const [otpDone, setOtpDone] = useState(false)

    const [showWebView, setShowWebView] = useState(false)
    const [otpUrl, setOtpUrl] = useState("")

    const onSubmitInfo = async () => {

        setLoaderVisible(true)

        const result = await getVendorOtpUrl()

        // setLoaderVisible(false)

        if (result[0] != 200) {
            seterrorModal(true)
            setErrorText(result[1])
        } else {
            const vendorOtpUrl = result[1]
            setOtpUrl(vendorOtpUrl)
            console.log(vendorOtpUrl)

            const parsed = new URL(vendorOtpUrl)
            const value = parsed.searchParams.get("metadata[user_id]") ?? ''
            console.log(value)

            // const wsSession = kycWebSocket(value ?? '')
            // const wsPromise = wsSession.promise

            const socketUrl = `wss://${BARE_URL}/ws?user_id=${value}`
            const vendorS = new WebSocket(socketUrl)

            vendorS.onopen = () => {
                console.log("vendor auth socket connected, awaiting results")
            }

            vendorS.onmessage = (event) => {
                const msg = JSON.parse(event.data)
                console.log(msg)
                setShowWebView(false)
            }

            setLoaderVisible(false)

            // show webview
            setShowWebView(true)

            // try {
            //     const result = await wsPromise
            //     console.log("i reached here at the end")
            //     console.log("final kyc result:", result)
            //     setShowWebView(false)
            //     setLoaderVisible(false)
            //     router.push("/auth/pic")
            // } catch (error) {
            //     console.log("failed to get kyc results")
            // }

            // setShowWebView(false)
            setLoaderVisible(false)
            console.log("i got here lasssst")
        }

    }

    // const getSocketResults = async () => {
    //     const wsSession = kycWebSocket(vendorId)
    //     const { promise: wsPromise, cancel } = wsSession

    //     try {
    //         const result = await wsPromise
    //         console.log("i reached here at the end")
    //         console.log("final kyc result:", result)
    //         setShowWebView(false)
    //         setLoaderVisible(false)
    //         router.push("/auth/pic")
    //     } catch (error) {
    //         console.log("failed to get kyc results")
    //     }

    //     setShowWebView(false)
    //     setLoaderVisible(false)

    //     console.log("all done")
    // }

    const onSkip = () => {
        router.replace("/auth/pic")
    }

    const [loaderVisible, setLoaderVisible] = useState(false)
    const [errorModal, seterrorModal] = useState(true)
    const [errorText, setErrorText] = useState("")
    const [correctModal, setCorrectModal] = useState(false)
    const [correctText, setCorrectText] = useState("")
    const [nxtPage, setNxtPage] = useState(false)

    useEffect(() => {
        if (errorText != "") {
            seterrorModal(true)
        } else {
            seterrorModal(false)
        }
    }, [errorText])

    useEffect(() => {
        if (correctText != "") {
            setCorrectModal(true)
        } else {
            setCorrectModal(false)
        }
    }, [correctText])

    return (
        <SafeAreaProvider>
            <SafeAreaView style={[globals.homeContainer, globals.container]}>
                <View>
                    <BackArrow backFun={() => router.replace("/(vendor)/dashboard")} />
                </View>

                <KeyboardAwareScrollView
                    keyboardShouldPersistTaps={"handled"}
                    showsVerticalScrollIndicator={false}
                    enableOnAndroid={true}
                    extraScrollHeight={10}
                    ref={scrollRef}>

                    <View style={signupStyles.layoutPadding}>
                        <Text style={roboto.titleMediumBold}>Almost there</Text>
                        <Text style={[roboto.bodyMedium, signupStyles.pText, signupStyles.grayText]}>Please provide us with more information to complete your profile</Text>
                    </View>

                    <View style={signupStyles.layoutPadding}>
                        <Input
                            label="Address"
                            hint=""
                            value={address}
                            onChangeText={(text) => { setAddress(text) }}
                            returnKeyType="next"
                            onSubmitEditing={() => focusNext(NINRef, scrollRef)}
                            ref={addressRef}
                        />
                    </View>

                    <View style={signupStyles.layoutPadding}>
                        <Select text="Continue" selected selectFun={() => onSubmitInfo()} clickable={incomplete} />
                    </View>

                    <View style={signupStyles.layoutPadding}>
                        <Select text="Skip" selected={false} selectFun={() => onSkip()} />
                    </View>


                    {
                        loaderVisible ? <Loader /> : null
                    }

                    {
                        errorModal ? <ErrorModal text={errorText} errorFun={() => setErrorText("")} /> : null
                    }

                    {
                        correctModal ? <ErrorModal correct text={correctText} errorFun={() => { setCorrectText(""); if (nxtPage) router.replace("/auth/pic") }} /> : null
                    }

                </KeyboardAwareScrollView>

                {showWebView && (
                    <KycWebView
                        url={otpUrl}
                        onComplete={() => {
                            console.log("WebView finished, but websocket still listening...");
                            closeWebView();
                        }}
                        onCancel={() => {
                            console.log("User cancelled verification");
                            cancelVerification();
                        }}
                    />
                )}
            </SafeAreaView>
        </SafeAreaProvider>
    )
}
