import BackArrow from "@/components/back";
import Input from "@/components/input";
import Select from "@/components/select";
import { signupStyles } from "@/styles/signup";
import { Image, Keyboard, KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import React, { useEffect, useRef, useState } from "react";
import { images } from "@/constants/images";
import { router } from "expo-router";
import { colors, globals, roboto } from "@/styles/globals";
import { signUp } from "@/services/signUp";
import * as SecureStore from "expo-secure-store"
import Loader from "@/components/loader";
import ErrorModal from "@/components/errorModal";


export default function SignUp() {

    let role: string | null
    useEffect(() => {
        const getRole = async () => {
            role = await SecureStore.getItemAsync("MODE")
        }

        getRole()
    }, [])

    const firstNameRef = useRef<TextInput | null>(null)
    const lastNameRef = useRef<TextInput | null>(null)
    const emailRef = useRef<TextInput | null>(null)
    const phoneRef = useRef<TextInput | null>(null)
    const passwordRef = useRef<TextInput | null>(null)
    const confirmPasswordRef = useRef<TextInput | null>(null)

    const scrollRef = useRef<KeyboardAwareScrollView | null>(null)

    const focusNext = (nextRef: React.RefObject<TextInput | null>) => {
        const nextInput = nextRef.current
        if (!nextInput) return
        nextInput.focus()
        scrollRef.current?.scrollToFocusedInput(nextInput)
    }

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const [passwordStrength, setPasswordStrength] = useState("low")
    const [specialChar, setSpecialChar] = useState(false)
    const [includesNum, setIncludesNum] = useState(false)
    const [allCases, setAllCases] = useState(false)

    const [passwordMatch, setPasswordMatch] = useState(false)

    const defaultIcon = images.bad
    const validIcon = images.check
    const midIcon = images.alertCircle

    const [secureIcon, setSecureIcon] = useState(images.closedEyeDefault)
    const [securePass, setSecurePass] = useState(true)

    const [formIncomplete, setFormIncomplete] = useState(true)

    const [invalidPassword, setInvalidPassword] = useState(false)
    const [invalidConfirmPassword, setinvalidConfirmPassword] = useState(false)

    const [invalidEmail, setInvalidEmail] = useState(false)
    const [invalidPhone, setInvalidPhone] = useState(false)

    const checkPass = (text: string) => {

        setPassword(text)

        if (/\d/.test(text)) setIncludesNum(true); else setIncludesNum(false)
        if (/[^a-zA-Z0-9\s]/.test(text)) setSpecialChar(true); else setSpecialChar(false)
        if (/[A-Z]/.test(text) && /[a-z]/.test(text)) setAllCases(true); else setAllCases(false)
        if (text.length < 8) setPasswordStrength("low")
        if (text.length >= 8) {
            setPasswordStrength("medium")
        }
        if (text.length > 10 && includesNum == true && specialChar == true && allCases == true) {
            setPasswordStrength("strong")
            setInvalidPassword(false)
        }

        if (text === confirmPassword) {
            setPasswordMatch(true)
            setinvalidConfirmPassword(false)
        } else {
            setPasswordMatch(false)
            setinvalidConfirmPassword(true)
        }
    }

    const checkConfirmPass = (text: string) => {
        if (text === password) {
            setPasswordMatch(true)
            setinvalidConfirmPassword(false)
        } else {
            setPasswordMatch(false)
            setinvalidConfirmPassword(true)
        }

        setConfirmPassword(text)
    }

    const validateEmail = (email: string) => {
        const emailRegex = /^\s*[^\s@]+@[^\s@]+\.[^\s@]+[^\s@.]\s*$/;
        setInvalidEmail(!emailRegex.test(email))
    };

    const validatePhone = (phoneNumber: string) => {
        const phoneRegex = /^\s*0\d{10}\s*$/
        setInvalidPhone(!phoneRegex.test(phoneNumber))
    }

    useEffect(() => {
        if (passwordStrength == "strong") {
            if (firstName && lastName && email && !invalidEmail && phone && !invalidPhone && passwordMatch) {
                setFormIncomplete(false)
            } else {
                setFormIncomplete(true)
            }
        }
        else {
            setFormIncomplete(true)
        }
    }, [firstName, lastName, email, phone, passwordStrength, passwordMatch, invalidEmail, invalidPassword]);

    useEffect(() => {
        if (securePass) {
            setSecureIcon(images.closedEyeDefault)
        } else {
            setSecureIcon(images.openEyeDefault)
        }
    }, [securePass]);

    const clickContinue = async () => {

        setLoaderVisible(true)

        const newUser = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            phone: "+234" + phone.trim().slice(),
            password: password.trim(),
            role: role ? role : "user"
        }

        await SecureStore.setItemAsync("EMAIL", newUser.email)

        const result = await signUp(newUser)

        setLoaderVisible(false)

        if (result[0] === "201") {
            router.push('/auth/otp')
        } else {

            if (result[1] == undefined) setErrorText("Server Down. Try Again Later.")
            else setErrorText(result[1])
        }

    }

    const [loaderVisible, setLoaderVisible] = useState(false)
    const firstLoad = useRef(true)

    useEffect(() => {
        if (firstLoad.current) {
            firstLoad.current = false
            return
        }

        if (loaderVisible) {
            setFormIncomplete(true)
        } else {
            setFormIncomplete(false)
        }
    }, [loaderVisible])

    const [errorModal, seterrorModal] = useState(false)
    const [errorText, setErrorText] = useState("")

    useEffect(() => {
        if (errorText != "") {
            seterrorModal(true)
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

                    <BackArrow backFun={() => router.back()} />

                    <View style={signupStyles.layoutPadding}>
                        <Text style={[signupStyles.headerText, roboto.titleLargeBold]}>Create Account</Text>
                        <Text style={[signupStyles.pText, roboto.bodyLarge]}>Please enter your personal details to complete your profile</Text>
                    </View>

                    <View style={[signupStyles.firstInputLine, signupStyles.layoutPadding]}>
                        <View style={signupStyles.eachName}>
                            <Input
                                ref={firstNameRef}
                                label="First Name"
                                hint="john"
                                returnKeyType="next"
                                onSubmitEditing={() => focusNext(lastNameRef)}
                                onChangeText={(text) => {
                                    setFirstName(text)
                                }} />
                        </View>
                        <View style={signupStyles.eachName}>
                            <Input
                                ref={lastNameRef}
                                label="Last Name"
                                hint="doe"
                                returnKeyType="next"
                                onSubmitEditing={() => focusNext(emailRef)}
                                onChangeText={(text) => {
                                    setLastName(text)
                                }} />
                        </View>
                    </View>

                    <View style={signupStyles.formPadding}>
                        <Input
                            ref={emailRef}
                            label="Email"
                            hint="email@email.com"
                            returnKeyType="next"
                            onSubmitEditing={() => focusNext(phoneRef)}
                            onChangeText={(text) => { setEmail(text); validateEmail(text) }}
                            invalid={invalidEmail} />
                    </View>

                    <View style={signupStyles.formPadding}>
                        <Input
                            ref={phoneRef}
                            label="Phone (eg. 08000000000)"
                            hint="08000000000"
                            returnKeyType="next"
                            onSubmitEditing={() => focusNext(passwordRef)}
                            keyboardType="numeric"
                            onChangeText={(text) => { setPhone(text); validatePhone(text) }}
                            invalid={invalidPhone} />
                    </View>

                    <View style={signupStyles.formPadding}>
                        <Input
                            ref={passwordRef}
                            label="Password"
                            hint="********"
                            returnKeyType="next"
                            onSubmitEditing={() => focusNext(confirmPasswordRef)}
                            onChangeText={(text) => {
                                checkPass(text)
                            }}
                            invalid={invalidPassword}
                            icon={secureIcon}
                            secureText={securePass}
                            setSecureText={() => setSecurePass(!securePass)}
                        />
                    </View>

                    {
                        password == "" ? null : <View style={signupStyles.passwordCheckV}>
                            <View style={signupStyles.passwordCheck}>
                                <Image
                                    source={
                                        passwordStrength == "low" ? defaultIcon : passwordStrength == "medium" ? midIcon : validIcon
                                    }
                                    style={signupStyles.icon} />
                                <Text style={[signupStyles.passText, passwordStrength == "medium" ? signupStyles.mediumPassText : passwordStrength == "strong" ? signupStyles.validPassText : null, roboto.bodySmall]}>Password strength: {passwordStrength}</Text>
                            </View>

                            <View style={signupStyles.passwordCheck}>
                                <Image
                                    source={specialChar ? validIcon : defaultIcon}
                                    style={signupStyles.icon} />
                                <Text style={[signupStyles.passText, specialChar && signupStyles.validPassText, roboto.bodySmall]}>At least 1 special character </Text>
                            </View>

                            <View style={signupStyles.passwordCheck}>
                                <Image
                                    source={includesNum ? validIcon : defaultIcon}
                                    style={signupStyles.icon} />
                                <Text style={[signupStyles.passText, includesNum && signupStyles.validPassText, roboto.bodySmall]}>Includes a number</Text>
                            </View>

                            <View style={signupStyles.passwordCheck}>
                                <Image
                                    source={allCases ? validIcon : defaultIcon}
                                    style={signupStyles.icon} />
                                <Text style={[signupStyles.passText, allCases && signupStyles.validPassText, roboto.bodySmall]}>Lower case and upper case letters</Text>
                            </View>
                        </View>
                    }

                    <View style={signupStyles.formPadding}>
                        <Input
                            ref={confirmPasswordRef}
                            label="Confirm Password"
                            hint="********"
                            returnKeyType="done"
                            onSubmitEditing={() => Keyboard.dismiss()}
                            onChangeText={(text) => checkConfirmPass(text)}
                            invalid={invalidConfirmPassword}
                            icon={secureIcon}
                            secureText={securePass}
                            setSecureText={() => { setSecurePass(!securePass) }} />
                    </View>

                    {
                        confirmPassword === "" ? null : <View>
                            <View style={signupStyles.passwordCheck}>
                                <Image
                                    source={passwordMatch ? validIcon : defaultIcon}
                                    style={signupStyles.icon} />
                                <Text style={[signupStyles.passText, passwordMatch && signupStyles.validPassText, roboto.bodySmall]}>{passwordMatch ? "Matches password" : "Not the same as password"}</Text>
                            </View>
                        </View>
                    }

                    <View style={signupStyles.layoutPadding}>
                        <View style={signupStyles.continueView}>
                            <Select text="Continue" selected={true} selectFun={clickContinue} clickable={formIncomplete} />
                        </View>
                    </View>


                    <View style={signupStyles.policyView}>
                        <Text style={[roboto.bodySmall, colors.grays]}>By registering, you have accepted our </Text>
                        <Text style={[roboto.bodySmall, colors.foundationWarningDark]}>Terms and Conditions</Text>
                        <Text style={[roboto.bodySmall, colors.grays]}> and our </Text>
                        <Text style={[roboto.bodySmall, colors.foundationWarningDark]}>Data Policy.</Text>
                    </View>


                    {
                        loaderVisible ? <Loader /> : null
                    }

                    {
                        errorModal ? <ErrorModal text={errorText} errorFun={() => { setErrorText(""); seterrorModal(false) }} /> : null
                    }

                </KeyboardAwareScrollView>

            </KeyboardAvoidingView>

        </SafeAreaView>
    )
}
