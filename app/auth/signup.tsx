import BackArrow from "@/components/back";
import Input from "@/components/input";
import Select from "@/components/select";
import { signupStyles } from "@/styles/signup";
import { Keyboard, KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import React, { useRef, useState } from "react";


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

    return (
        <SafeAreaView style={signupStyles.main}>

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
                    extraScrollHeight={150}
                    ref={scrollRef}
                >

                    <BackArrow />

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
                            onSubmitEditing={() => focusNext(lastNameRef)} />
                        </View>
                        <View style={signupStyles.break}></View>
                        <View style={signupStyles.eachName}>
                            <Input 
                            ref={lastNameRef}
                            label="Last Name" 
                            hint="doe"
                            returnKeyType="next"
                            onSubmitEditing={() => focusNext(emailRef)} />
                        </View>
                    </View>

                    <View style={signupStyles.formPadding}>
                        <Input 
                        ref={emailRef}
                        label="Email" 
                        hint="email@email.com"
                        returnKeyType="next"
                        onSubmitEditing={() => focusNext(phoneRef)} />
                    </View>

                    <View style={signupStyles.formPadding}>
                        <Input 
                        ref={phoneRef}
                        label="Phone" 
                        hint="2349012345678"
                        returnKeyType="next"
                        onSubmitEditing={() => focusNext(passwordRef)}
                        keyboardType="numeric" />
                    </View>

                    <View style={signupStyles.formPadding}>
                        <Input 
                        ref={passwordRef}
                        label="Password" 
                        hint="********"
                        returnKeyType="next"
                        onSubmitEditing={() => focusNext(confirmPasswordRef)} />
                    </View>

                    <View style={signupStyles.formPadding}>
                        <Input 
                        ref={confirmPasswordRef}
                        label="Confirm Password" 
                        hint="********"
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()} />
                    </View>

                    <View style={signupStyles.layoutPadding}>
                        <View style={signupStyles.continueView}>
                            <Select text="Continue" selected={true} selectFun={() => null} />
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
