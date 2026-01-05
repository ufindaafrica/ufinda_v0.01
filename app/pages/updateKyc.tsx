import BackArrow from "@/components/back";
import ErrorModal from "@/components/errorModal";
import Input from "@/components/input";
import LineBreak from "@/components/lineBreak";
import Loader from "@/components/loader";
import Select from "@/components/select";
import { focusNext } from "@/deps/focusNext";
import { moderateScale } from "@/deps/scale";
import { studentKyc, vendorKyc } from "@/services/studentKyc";
import { globals, roboto } from "@/styles/globals";
import { idStyles } from "@/styles/id";
import { router } from "expo-router";
import { getItemAsync } from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Text, TextInput } from "react-native";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";


export default function UpdateKyc() {

    const keyboardScrollViewRef = useRef<KeyboardAwareScrollView | null>(null)
    const addressRef = useRef<TextInput | null>(null)
    const lgaRef = useRef<TextInput | null>(null)
    const stateRef = useRef<TextInput | null>(null)
    const matricNoRef = useRef<TextInput | null>(null)
    const facultyRef = useRef<TextInput | null>(null)
    const deptRef = useRef<TextInput | null>(null)

    const [address, setAddress] = useState("")
    const [lga, setLga] = useState("")
    const [state, setState] = useState("")
    const [matricNo, setMatricNo] = useState("")
    const [faculty, setFaculty] = useState("")
    const [dept, setDept] = useState("")

    const [mode, setMode] = useState("")
    useEffect(() => {
        const getMode = async () => {
            try {
                const role = await getItemAsync('ROLE') ?? await getItemAsync("MODE")
                role ? setMode(role) : router.replace("/auth/login")
            } catch {
                router.replace("/auth/login")
            }

            return
        }
        getMode()
    }, [])

    const onSubmit = async () => {
        setLoaderVisible(true)

        if (address == "" && lga == "" && state == "" && matricNo == "" && faculty == "" && dept == "") {
            setLoaderVisible(false)
            return
        }

        const kycData = {
            ...(address && {address: address}),
            ...(lga && {lga: lga}),
            ...(state && {state: state}),
            ...(matricNo && {matricNo: matricNo}),
            ...(faculty && {faculty: faculty}),
            ...(dept && {dept: dept})
        }

        const update = mode === "user" ? await studentKyc(kycData) : await vendorKyc(kycData)

        if (update[0] != '200') {
            seterrorModal(true)
            setErrorText(update[1])
        } else {
            setCorrectModal(true)
            setCorrectModal(update[1])
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


    return (
        <SafeAreaProvider style={[globals.container, globals.lightContainer]}>
            <SafeAreaView style={[globals.container, globals.lightContainer]}>
                {mode && <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><KeyboardAwareScrollView
                    ref={keyboardScrollViewRef}
                    style={{ flex: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    enableOnAndroid={true}
                    extraScrollHeight={15}>
                    <View style={idStyles.headerV}>
                        <View style={idStyles.firstHeaderV}>
                            <BackArrow backFun={() => router.back()} large />
                            <Text style={roboto.titleLargeBold}>Update Kyc</Text>
                        </View>
                    </View>
                    <LineBreak />
                    <View style={{ padding: moderateScale(16), paddingBottom: 0 }}>
                        <Input
                            ref={addressRef}
                            label="Address"
                            hint="ex. no 8 example street"
                            value={address}
                            onChangeText={(text) => setAddress(text)}
                            returnKeyType="next"
                            onSubmitEditing={() => focusNext(lgaRef, keyboardScrollViewRef)} />
                    </View>
                    <View style={{ padding: moderateScale(16), paddingBottom: 0 }}>
                        <Input
                            ref={lgaRef}
                            label="LGA"
                            hint="ex. ikeja"
                            value={lga}
                            onChangeText={(text) => setLga(text)}
                            returnKeyType="next"
                            onSubmitEditing={() => focusNext(stateRef, keyboardScrollViewRef)} />
                    </View>
                    <View style={{ padding: moderateScale(16), paddingBottom: 0 }}>
                        <Input
                            ref={stateRef}
                            label="State"
                            hint="ex. Lagos"
                            value={state}
                            onChangeText={(text) => setState(text)}
                            returnKeyType={mode === "user" ? "next" : "done"}
                            onSubmitEditing={() => mode === "user" ? focusNext(matricNoRef, keyboardScrollViewRef) : Keyboard.dismiss()} />
                    </View>
                    {
                        mode === "user" && <View style={{ padding: moderateScale(16), paddingBottom: 0 }}>
                            <Input
                                ref={matricNoRef}
                                label="Matric No"
                                hint="ex. 2025101"
                                value={matricNo}
                                onChangeText={(text) => setMatricNo(text)}
                                returnKeyType="next"
                                onSubmitEditing={() => focusNext(facultyRef, keyboardScrollViewRef)} />
                        </View>
                    }
                    {
                        mode === "user" && <View style={{ padding: moderateScale(16), paddingBottom: 0 }}>
                            <Input
                                ref={facultyRef}
                                label="Faculty"
                                hint="ex. Engineering"
                                value={faculty}
                                onChangeText={(text) => setFaculty(text)}
                                returnKeyType="next"
                                onSubmitEditing={() => focusNext(deptRef, keyboardScrollViewRef)} />
                        </View>
                    }
                    {
                        mode === "user" && <View style={{ padding: moderateScale(16), paddingBottom: 0 }}>
                            <Input
                                ref={deptRef}
                                label="Department"
                                hint="ex. Petroleum Eng"
                                value={dept}
                                onChangeText={(text) => setDept(text)}
                                returnKeyType="done"
                                onSubmitEditing={() => Keyboard.dismiss()} />
                        </View>
                    }
                </KeyboardAwareScrollView></KeyboardAvoidingView>}

                <View style={{ padding: moderateScale(16), position: 'absolute', bottom: 0, width: '100%' }}>
                    <Select text="Update" selected selectFun={onSubmit} />
                </View>

                {
                    loaderVisible ? <Loader /> : null
                }

                {
                    errorModal ? <ErrorModal text={errorText} errorFun={() => setErrorText("")} /> : null
                }

                {
                    correctModal ? <ErrorModal correct text={correctText} errorFun={() => { setCorrectText(""); mode === "user" ? router.replace("/(tabs)/profile") : router.replace("/(vendor)/profile")}} /> : null
                }
            </SafeAreaView>
        </SafeAreaProvider>
    )
}
