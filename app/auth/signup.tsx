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
import { globals } from "@/styles/globals";


export default function SignUp() {

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

    const [secureIcon, setSecureIcon] = useState(images.openEyeDefault)
    const [securePass, setSecurePass] = useState(false)

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
            // setInvalidPassword(false)
        } else {
            // setInvalidPassword(true)
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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

    const clickContinue = () => {

        const newUser = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: phone,
            password: "+234" + password.trim().slice(1)
        }

        router.push('/auth/otp')
    }


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
                        <Text style={signupStyles.headerText}>Create Account</Text>
                        <Text style={signupStyles.pText}>Please enter your personal details to complete your profile</Text>
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
                        <View style={signupStyles.break}></View>
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
                            onChangeText={(text) => { setEmail(text) ; validateEmail(text) }} 
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
                            onChangeText={(text) => { setPhone(text) ; validatePhone(text) }} 
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
                        password == "" ? null : <View>
                            <View style={signupStyles.passwordCheck}>
                                <Image
                                    source={
                                        passwordStrength == "low" ? defaultIcon : passwordStrength == "medium" ? midIcon : validIcon
                                    }
                                    style={signupStyles.icon} />
                                <Text style={[signupStyles.passText, passwordStrength == "medium" ? signupStyles.mediumPassText : passwordStrength == "strong" ? signupStyles.validPassText : null]}>Password strength: {passwordStrength}</Text>
                            </View>

                            <View style={signupStyles.passwordCheck}>
                                <Image
                                    source={specialChar ? validIcon : defaultIcon}
                                    style={signupStyles.icon} />
                                <Text style={[signupStyles.passText, specialChar && signupStyles.validPassText]}>At least 1 special character</Text>
                            </View>

                            <View style={signupStyles.passwordCheck}>
                                <Image
                                    source={includesNum ? validIcon : defaultIcon}
                                    style={signupStyles.icon} />
                                <Text style={[signupStyles.passText, includesNum && signupStyles.validPassText]}>Includes a number</Text>
                            </View>

                            <View style={signupStyles.passwordCheck}>
                                <Image
                                    source={allCases ? validIcon : defaultIcon}
                                    style={signupStyles.icon} />
                                <Text style={[signupStyles.passText, allCases && signupStyles.validPassText]}>Lower case and upper case letters</Text>
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
                                <Text style={[signupStyles.passText, passwordMatch && signupStyles.validPassText]}>{passwordMatch ? "Matches password" : "Not the same as password"}</Text>
                            </View>
                        </View>
                    }

                    <View style={signupStyles.layoutPadding}>
                        <View style={signupStyles.continueView}>
                            <Select text="Continue" selected={true} selectFun={clickContinue} clickable={formIncomplete} />
                        </View>
                    </View>

                    <View style={signupStyles.formPadding}>
                        <View style={signupStyles.policyView}>
                            <Text style={signupStyles.policyText}>By registering, you have accepted our </Text>
                            <Text style={signupStyles.policyText}>terms and conditions</Text>
                            <Text style={signupStyles.policyText}> and our </Text>
                            <Text style={signupStyles.policyText}>data policy.</Text>
                        </View>
                    </View>

                </KeyboardAwareScrollView>

            </KeyboardAvoidingView>

        </SafeAreaView>
    )
}
