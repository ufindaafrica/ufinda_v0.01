import ErrorModal from "@/components/errorModal";
import Input from "@/components/input";
import Loader from "@/components/loader";
import Select from "@/components/select";
import { images } from "@/constants/images";
import { logIn } from "@/services/logIn";
import { fonts, globals } from "@/styles/globals";
import { signupStyles } from "@/styles/signup";
import { Link, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image, Keyboard, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Login() {
    const emailRef = useRef<TextInput | null>(null)
    const passwordRef = useRef<TextInput | null>(null)

    const scrollRef = useRef<KeyboardAwareScrollView | null>(null)

    const focusNext = (nextRef: React.RefObject<TextInput | null>) => {
        const nextInput = nextRef.current
        if (!nextInput) return
        nextInput.focus()
        scrollRef.current?.scrollToFocusedInput(nextInput)
    }

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const [secureIcon, setSecureIcon] = useState(images.openEyeDefault)
    const [securePass, setSecurePass] = useState(false)

    const [remember, setRemember] = useState(false)

    useEffect(() => {
        if (securePass) {
            setSecureIcon(images.closedEyeDefault)
        } else {
            setSecureIcon(images.openEyeDefault)
        }
    }, [securePass]);


    const clickContinue = async () => {

        const userData = {
            email: email.trim().toLowerCase(),
            password: password.trim()
        }

        setLoaderVisible(true)

        const result = await logIn(userData)

        setLoaderVisible(false)

        if (result[0] != "200") {
            setErrorText(result[1])
        } else {
            router.replace("/(tabs)/home")
        }

    }

    const [loaderVisible, setLoaderVisible] = useState(false)
    const [errorModal, setErrorModal] = useState(false)
    const [errorText, setErrorText] = useState("")

    useEffect(() => {
        if (errorText != "") {
            setErrorModal(true)
        } else {
            setErrorModal(false)
        }
    }, [errorText])

    return (
        <SafeAreaView style={[signupStyles.main, globals.container]}>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >

                <KeyboardAwareScrollView
                    contentContainerStyle={{
                        flexGrow: 1, paddingBottom: 40
                    }}
                    style={{ flex: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    enableOnAndroid={true}
                    extraScrollHeight={15}
                    ref={scrollRef}
                >
                    <View style={signupStyles.layoutPadding}>
                        <Text style={signupStyles.headerText}>Login to your Account</Text>
                        <Text style={signupStyles.pText}>Please enter your email and password to login to your account.</Text>
                    </View>

                    <View style={signupStyles.formPadding}>
                        <Input
                            ref={emailRef}
                            label="Email"
                            hint="email@email.com"
                            returnKeyType="next"
                            onSubmitEditing={() => focusNext(passwordRef)}
                            onChangeText={(text) => { setEmail(text) }} />
                    </View>

                    <View style={signupStyles.formPadding}>
                        <Input
                            ref={passwordRef}
                            label="Password"
                            hint="********"
                            returnKeyType="done"
                            onSubmitEditing={() => Keyboard.dismiss()}
                            onChangeText={(text) => {
                                setPassword(text)
                            }}
                            icon={secureIcon}
                            secureText={securePass}
                            setSecureText={() => setSecurePass(!securePass)}
                        />

                        <View style={signupStyles.altV}>
                            <View style={signupStyles.remV}>
                                <TouchableOpacity onPress={() => setRemember(!remember)}>
                                    <Image source={!remember ? images.checkedBox : images.emptyBox} style={signupStyles.remImg} />
                                </TouchableOpacity>
                                <Text style={signupStyles.remText}>Remember me</Text>
                            </View>
                            <View style={signupStyles.forgotV}>
                                <Link href={"https://"} style={signupStyles.forgotText}>Forgot Password?</Link>
                            </View>
                        </View>
                    </View>

                    <View style={signupStyles.layoutPadding}>
                        <View style={signupStyles.continueView}>
                            <Select text="Continue" selected={true} selectFun={clickContinue} clickable={!email || !password} />
                        </View>

                        <Text style={[signupStyles.orText, signupStyles.orPadding]}>OR</Text>

                        <Select clickable={true} text="Continue with Google" selected={false} icon={images.google} />
                    </View>

                    {
                        loaderVisible || errorModal ? null : <View style={signupStyles.bottomView}>
                            <View style={signupStyles.policyView}>
                                <Text style={signupStyles.policyText}>Don't have an account? </Text>
                                <Link href={"/auth/signup"} style={[signupStyles.policyText, { fontFamily: fonts.bold, color: "#008000" }]}>Register</Link>
                            </View>
                        </View>
                    }

                    {
                        loaderVisible ? <Loader /> : null
                    }

                    {
                        errorModal ? <ErrorModal text={errorText} errorFun={() => setErrorText("")} /> : null
                    }

                </KeyboardAwareScrollView>

            </KeyboardAvoidingView>

        </SafeAreaView>
    )
}
