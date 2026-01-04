import BackArrow from "@/components/back";
import Input from "@/components/input";
import Select from "@/components/select";
import { focusNext } from "@/deps/focusNext";
import { globals, roboto } from "@/styles/globals";
import { signupStyles } from "@/styles/signup";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Keyboard, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { getVendorOtpUrl } from "@/services/vendorOtpUrl";
import Loader from "@/components/loader";
import ErrorModal from "@/components/errorModal";
import { kycWebSocket } from "@/services/kycWebSocket";
import KycWebView from "@/components/webview";
import { BARE_URL, getAccessToken } from "@/services/apiConstants";
import { toast } from "@/deps/toast";
import AsyncStorage from "@react-native-async-storage/async-storage";


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
        kycSessionRef.current?.cancel()
        kycSessionRef.current = null
        setShowWebView(false)
        setLoaderVisible(false)
    }

    const [otpDone, setOtpDone] = useState(false)

    const [showWebView, setShowWebView] = useState(false)
    const [otpUrl, setOtpUrl] = useState("")

    const kycSessionRef = useRef<ReturnType<typeof kycWebSocket> | null>(null)

    const onSubmitInfo = async () => {

        setLoaderVisible(true)

        await AsyncStorage.setItem("ADDRESS", address)

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
            const vendorId = parsed.searchParams.get("metadata[user_id]") ?? ''
            console.log(vendorId)

            if (!vendorId) {
                setLoaderVisible(false)
                toast("Error, try again.")
                return
            }

            const session = kycWebSocket(vendorId)
            kycSessionRef.current = session

            session.promise
                .then((data) => {
                    console.log("kyc complete", data)
                    setShowWebView(false)
                    router.replace("/auth/pic")
                })
                .catch((err) => {
                    console.log("kyc failed:", err)
                    setShowWebView(false)
                    toast("Error, try again")
                })
                .finally(() => {
                    kycSessionRef.current = null
                })

            setLoaderVisible(false)

            // show webview
            setShowWebView(true)

            // setLoaderVisible(false)
            console.log("i got here lasssst")
        }

    }

    useEffect(() => {
        return () => {
            kycSessionRef.current?.cancel()
        }
    }, [])

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
                            returnKeyType="done"
                            onSubmitEditing={() => Keyboard.dismiss()}
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
