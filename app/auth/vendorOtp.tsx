import BackArrow from "@/components/back";
import Input from "@/components/input";
import Select from "@/components/select";
import { focusNext } from "@/deps/focusNext";
import { globals, roboto } from "@/styles/globals";
import { signupStyles } from "@/styles/signup";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Keyboard, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";


export default function VendorOtp() {

    const [address, setAddress] = useState("")
    const [NIN, setNIN] = useState("")

    const addressRef = useRef<TextInput | null>(null)
    const NINRef = useRef<TextInput | null>(null)
    const scrollRef = useRef<KeyboardAwareScrollView | null>(null)

    const onSubmitInfo = async () => {}

    const onSkip = () => {
        router.replace("/auth/pic")
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={[globals.homeContainer, globals.container]}>
                <View>
                    <BackArrow backFun={() => router.replace("/home")} />
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
                            label="Type"
                            value="Agent"
                            editable={false}
                        />
                    </View>

                    <View style={signupStyles.layoutPadding}>
                        <Input
                            label="Address"
                            hint=""
                            value={address}
                            onChangeText={(text) => {setAddress(text)}}
                            returnKeyType="next"
                            onSubmitEditing={() => focusNext(NINRef, scrollRef)}
                            ref={addressRef}
                        />
                    </View>

                    <View style={signupStyles.layoutPadding}>
                        <Input
                            label="NIN"
                            hint="01234567890"
                            value={NIN}
                            onChangeText={(text) => {setNIN(text)}}
                            returnKeyType="done"
                            onSubmitEditing={() => Keyboard.dismiss()}
                            ref={NINRef}
                        />
                    </View>

                    <View style={signupStyles.layoutPadding}>
                        <Select text="Continue" selected selectFun={() => onSubmitInfo()} />
                    </View>

                    <View style={signupStyles.layoutPadding}>
                        <Select text="Skip" selected={false} selectFun={() => onSkip()} />
                    </View>

                </KeyboardAwareScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    )
}
