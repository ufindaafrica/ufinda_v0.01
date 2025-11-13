import BackArrow from "@/components/back";
import OtpInput from "@/components/otpInput";
import Select from "@/components/select";
import { images } from "@/constants/images";
import { resendOtp } from "@/services/resendOtp";
import { globals, roboto } from "@/styles/globals";
import { otpStyles } from "@/styles/otp";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image, Keyboard, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store"
import Loader from "@/components/loader";
import ErrorModal from "@/components/errorModal";
import { verifyOtp } from "@/services/verifyOtp";


export default function Otp() {

    const [userEmail, setUserEmail] = useState<string | null>("")
    const [mode, setMode] = useState<string | null>("")

    useEffect(() => {
        const getUserEmail = async () => {
            const email = await SecureStore.getItemAsync("EMAIL")
            setUserEmail(email)
            const userMode = await SecureStore.getItemAsync("MODE")
            setMode(userMode)
        }

        getUserEmail()
    }, [])

    const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""])

    const inputRefs = Array.from({ length: 6 }, () => useRef<TextInput>(null))

    const onValueEnter = (text: string, index: number) => {
        setOtpArray(prev => prev.map((item, i) => i === index ? text.toString() : item))
        if (text && index < 5) {
            inputRefs[index + 1].current?.focus()
        } else if (text && index == 5) {
            Keyboard.dismiss()
        }
    }

    const onContinue = async () => {
        const otp = otpArray.join("")

        if (userEmail) {

            setLoaderVisible(true)

            const result = await verifyOtp({
                email: userEmail,
                otp: otp
            })

            setLoaderVisible(false)

            if (result[0] != "200") {
                seterrorModal(true)
                setErrorText(result[1])
                setOtpArray(["", "", "", "", "", ""])
            } else {
                if (mode === "vendor") router.replace("/auth/vendorOtp")
                else router.replace("/auth/pic")
            }
            
        }
    }

    const onResend = async () => {
        
        if (userEmail) {

            setLoaderVisible(true)

            const result = await resendOtp({
                email: userEmail
            })

            setLoaderVisible(false)

            if (result[0] != "200") {
                seterrorModal(true)
                setErrorText(result[1])
            } else {
                setCorrectModal(true)
                setCorrectText(result[1])
            }
            
        }

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
        <SafeAreaView style={[globals.container]}>

            <View style={otpStyles.otpPadding}>
                <BackArrow backFun={() => router.back()} />
            </View>

            <View>
                <Image source={images.otpPic} style={[{ marginTop: 8 }, otpStyles.img]} />
            </View>

            <View style={[otpStyles.main, otpStyles.otpPaddingHorizontal]}>
                <Text style={roboto.titleMediumBold}>Code sent</Text>
                <Text style={[otpStyles.pText, roboto.bodyMedium]}>Please enter the code sent to your email address.</Text>
            </View>

            <View style={[otpStyles.otpPaddingMedium, otpStyles.otpV, otpStyles.otpPaddingHorizontal]}>
                <OtpInput ref={inputRefs[0]} value={otpArray[0]} valueChange={onValueEnter} index={0} />
                <OtpInput ref={inputRefs[1]} value={otpArray[1]} valueChange={onValueEnter} index={1} />
                <OtpInput ref={inputRefs[2]} value={otpArray[2]} valueChange={onValueEnter} index={2} />
                <OtpInput ref={inputRefs[3]} value={otpArray[3]} valueChange={onValueEnter} index={3} />
                <OtpInput ref={inputRefs[4]} value={otpArray[4]} valueChange={onValueEnter} index={4} />
                <OtpInput ref={inputRefs[5]} value={otpArray[5]} valueChange={onValueEnter} index={5} />
            </View>

            <View style={[otpStyles.main, otpStyles.otpPaddingHorizontal]}>
                <Select text="Continue" selected={true} clickable={otpArray.every(Boolean) ? false : true} selectFun={onContinue} />
            </View>

            <TouchableOpacity onPress={() => onResend()} style={[otpStyles.otpPaddingMedium, otpStyles.linkV]}>
                <Text style={[otpStyles.lText, roboto.mediumEmphasizedBold]}>Resend OTP</Text>
            </TouchableOpacity>

            {
                loaderVisible ? <Loader /> : null
            }

            {
                errorModal ? <ErrorModal text={errorText} errorFun={() => setErrorText("")} /> : null
            }

            {
                correctModal ? <ErrorModal correct text={correctText} errorFun={() => {setCorrectText("") ; if (nxtPage) router.replace("/auth/pic")}} /> : null
            }

        </SafeAreaView>
    )
}
