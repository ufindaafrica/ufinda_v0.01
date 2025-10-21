import BackArrow from "@/components/back";
import OtpInput from "@/components/otpInput";
import Select from "@/components/select";
import { images } from "@/constants/images";
import { globals } from "@/styles/globals";
import { otpStyles } from "@/styles/otp";
import { Link, router } from "expo-router";
import { useRef, useState } from "react";
import { Image, Keyboard, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Otp() {

    const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""])

    const inputRefs = Array.from({ length: 6}, () => useRef<TextInput>(null))

    const onValueEnter = (text: string, index: number) => {
        setOtpArray(prev => prev.map((item, i) => i === index ? text.toString() : item))
        if (text && index < 5) {
            inputRefs[index + 1].current?.focus()
        } else if ( text && index == 5) {
            Keyboard.dismiss()
        }
    }

    const onContinue = () => {
        const otp = otpArray.join("")
        console.log(otp)
        router.replace("/auth/pic")
    }

    return (
        <SafeAreaView style={[globals.container, globals.authContainer]}>

            <BackArrow backFun={() => router.back()} />

            <View>
                <Image source={images.otpPic} style={[otpStyles.main, otpStyles.img]} />
            </View>

            <View style={otpStyles.main}>
                <Text style={otpStyles.headerText}>Code sent</Text>
                <Text style={otpStyles.pText}>Please enter the code sent to your email.</Text>
            </View>

            <View style={[otpStyles.main, otpStyles.otpV]}>
                <OtpInput ref={inputRefs[0]} value={otpArray[0]} valueChange={onValueEnter} index={0} />
                <OtpInput ref={inputRefs[1]} value={otpArray[1]} valueChange={onValueEnter} index={1} />
                <OtpInput ref={inputRefs[2]} value={otpArray[2]} valueChange={onValueEnter} index={2} />
                <OtpInput ref={inputRefs[3]} value={otpArray[3]} valueChange={onValueEnter} index={3} />
                <OtpInput ref={inputRefs[4]} value={otpArray[4]} valueChange={onValueEnter} index={4} />
                <OtpInput ref={inputRefs[5]} value={otpArray[5]} valueChange={onValueEnter} index={5} />
            </View>

            <View style={otpStyles.main}>
                <Select text="Continue" selected={true} clickable={otpArray.every(Boolean) ? false : true} selectFun={onContinue} />
            </View>

            <View style={[otpStyles.main, otpStyles.linkV]}>
                <Link href={"/auth/otp"}>Resend OTP</Link>
            </View>

        </SafeAreaView>
    )
}
