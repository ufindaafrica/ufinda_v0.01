import BackArrow from "@/components/back";
import OtpInput from "@/components/otpInput";
import Select from "@/components/select";
import { images } from "@/constants/images";
import { globals } from "@/styles/globals";
import { otpStyles } from "@/styles/otp";
import { Link, router } from "expo-router";
import { Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Otp() {

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
                <OtpInput />
                <OtpInput />
                <OtpInput />
                <OtpInput />
                <OtpInput />
                <OtpInput /> 
            </View>

            <View style={otpStyles.main}>
            <Select text="Continue" selected={true} />
            </View>

            <View style={[otpStyles.main, otpStyles.linkV]}>
            <Link href={"/auth/otp"}>Resend OTP</Link>
            </View>

        </SafeAreaView>
    )
}
