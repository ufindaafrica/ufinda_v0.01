import BackArrow from "@/components/back";
import ErrorModal from "@/components/errorModal";
import Input from "@/components/input";
import LineBreak from "@/components/lineBreak";
import Loader from "@/components/loader";
import Select from "@/components/select";
import { focusNext } from "@/deps/focusNext";
import { moderateScale } from "@/deps/scale";
import { toast } from "@/deps/toast";
import { changePassword } from "@/services/changePassword";
import { logOut } from "@/services/logOut";
import { studentKyc, vendorKyc } from "@/services/studentKyc";
import { colors, globals, roboto } from "@/styles/globals";
import { idStyles } from "@/styles/id";
import { router } from "expo-router";
import { getItemAsync } from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Text, TextInput } from "react-native";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";


export default function ChangePassword() {

    const keyboardScrollViewRef = useRef<KeyboardAwareScrollView | null>(null)
    const oldPasswordRef = useRef<TextInput | null>(null)
    const newPasswordRef = useRef<TextInput | null>(null)
    const confirmNewPasswordRef = useRef<TextInput | null>(null)

    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmNewPassword, setConfirmNewPassword] = useState("")

    const onSubmit = async () => {
        setLoaderVisible(true)

        if (oldPassword == newPassword) {
            toast("new password cannot be the same as old password")
            setLoaderVisible(false)
            return
        }

        if (newPassword != confirmNewPassword) {
            toast("new password is not the same as confirm new password. make the two the same.")
            setLoaderVisible(false)
            return
        }

        const update = await changePassword(oldPassword, newPassword)

        if (update[0] != '200') {
            setLoaderVisible(false)
            seterrorModal(true)
            setErrorText(update[1])
        } else {
            setLoaderVisible(false)
            setCorrectModal(true)
            setCorrectText(update[1])
        }
    }

    const [loaderVisible, setLoaderVisible] = useState(false)
    const [errorModal, seterrorModal] = useState(true)
    const [errorText, setErrorText] = useState("")
    const [correctModal, setCorrectModal] = useState(false)
    const [correctText, setCorrectText] = useState("")

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

    const signOut = async () => {
        await logOut()
    }


    return (
        <SafeAreaProvider style={[globals.container, globals.lightContainer]}>
            <SafeAreaView style={[globals.container, globals.lightContainer]}>
                {<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><KeyboardAwareScrollView
                    ref={keyboardScrollViewRef}
                    style={{ flex: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    enableOnAndroid={true}
                    extraScrollHeight={15}>
                    <View style={[idStyles.headerV, { paddingBottom: 0 }]}>
                        <View style={idStyles.firstHeaderV}>
                            <BackArrow backFun={() => router.back()} large />
                            <Text style={roboto.titleLargeBold}>Change Password</Text>
                        </View>
                    </View>
                    <LineBreak />
                    <View style={{ padding: moderateScale(16), paddingBottom: 0 }}>
                        <Input
                            ref={oldPasswordRef}
                            label="Old Password"
                            hint="*****"
                            value={oldPassword}
                            onChangeText={(text) => setOldPassword(text)}
                            returnKeyType="next"
                            onSubmitEditing={() => focusNext(newPasswordRef, keyboardScrollViewRef)} 
                            secureText/>
                    </View>
                    {
                        <View style={{ padding: moderateScale(16), paddingBottom: 0 }}>
                            <Input
                                ref={newPasswordRef}
                                label="New Password"
                                hint="*****"
                                value={newPassword}
                                onChangeText={(text) => setNewPassword(text)}
                                returnKeyType="next"
                                onSubmitEditing={() => focusNext(confirmNewPasswordRef, keyboardScrollViewRef)}
                                secureText />
                        </View>
                    }
                    {
                        <View style={{ padding: moderateScale(16), paddingBottom: 0 }}>
                            <Input
                                ref={confirmNewPasswordRef}
                                label="Confirm New Password"
                                hint="*****"
                                value={confirmNewPassword}
                                onChangeText={(text) => setConfirmNewPassword(text)}
                                returnKeyType={"done"}
                                onSubmitEditing={() => Keyboard.dismiss()}
                                secureText />
                        </View>
                    }
                    
                </KeyboardAwareScrollView></KeyboardAvoidingView>}

                <View style={{ padding: moderateScale(16), position: 'absolute', bottom: 0, width: '100%' }}>
                    <Select text="Update" selected selectFun={onSubmit} clickable={!(oldPassword != "" && newPassword != "" && confirmNewPassword != "")} />
                    <Text style={[roboto.bodySmall, {textAlign: 'center', paddingTop: 4}, colors.grays]}>Passwords can only be changed once in 3 days</Text>
                </View>

                {
                    loaderVisible ? <Loader /> : null
                }

                {
                    errorModal ? <ErrorModal text={errorText} errorFun={() => setErrorText("")} /> : null
                }

                {
                    correctModal ? <ErrorModal correct text={correctText} errorFun={() => { setCorrectText(""); signOut() ; router.replace("/auth/login") }} /> : null
                }
            </SafeAreaView>
        </SafeAreaProvider>
    )
}
