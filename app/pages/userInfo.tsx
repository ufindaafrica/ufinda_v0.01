import BackArrow from "@/components/back";
import Input from "@/components/input";
import LineBreak from "@/components/lineBreak";
import Loader from "@/components/loader";
import Select from "@/components/select";
import { moderateScale } from "@/deps/scale";
import { toast } from "@/deps/toast";
import { getStudentInfo, getVendorInfo } from "@/services/getStudentInfo";
import { globals, roboto } from "@/styles/globals";
import { idStyles } from "@/styles/id";
import { signupStyles } from "@/styles/signup";
import { router } from "expo-router";
import { getItemAsync } from "@/deps/secureStorage";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView, useSafeAreaFrame } from "react-native-safe-area-context";


export default function PersonalInformation() {

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [address, setAddress] = useState("")
    const [lga, setLga] = useState("")
    const [matricNo, setMatricNo] = useState("")
    const [faculty, setFaculty] = useState("")
    const [dept, setDept] = useState("")
    const [level, setLevel] = useState("")

    const [mode, setMode] = useState("")

    useEffect(() => {
        const getMode = async () => {
            const role = await getItemAsync("ROLE") ?? await getItemAsync("MODE")
            if (role) setMode(role)
            else setMode("user")
        }
        getMode()
    }, [])

    const [loaderVisible, setLoaderVisible] = useState(false)

    const getUserInfo = async () => {
        if (!mode) return

        setLoaderVisible(true)

        let info = []

        if (mode === "user") {
            info = await getStudentInfo()

            if (info[0] != "200") {
                setLoaderVisible(false)
                toast(info[1])
            }
        } else {
            info = await getVendorInfo()

            if (info[0] != "200") {
                setLoaderVisible(false)
                toast(info[1])
            }
        }

        setFirstName(info[1]?.first_name ?? "")
        setLastName(info[1]?.last_name ?? "")
        setEmail(info[1]?.email ?? "")
        setAddress(info[1]?.kyc_data?.address ?? "")
        setLevel(info[1]?.kyc_data?.level ?? "")
        setMatricNo(info[1]?.kyc_data?.matric ?? "")
        setFaculty(info[1]?.kyc_data?.faculty ?? "")
        setDept(info[1]?.kyc_data?.dept ?? "")

        setLoaderVisible(false)
    }

    useEffect(() => {
        const setInfo = async () => {
            await getUserInfo()
        }

        setInfo()
    }, [mode])

    return (
        <SafeAreaProvider style={[globals.container, globals.lightContainer]}>
            <SafeAreaView style={[globals.container, globals.lightContainer]}>
                <View style={[idStyles.headerV, { paddingBottom: 0 }]}>
                    <View style={idStyles.firstHeaderV}>
                        <BackArrow backFun={() => router.back()} large />
                        <Text style={roboto.titleLargeBold}>Personal Information</Text>
                    </View>
                </View>
                <LineBreak />
                <ScrollView style={{ flex: 1 }}>
                    <View style={[signupStyles.firstInputLine, signupStyles.layoutPadding, { paddingHorizontal: moderateScale(16) }]}>
                        <View style={signupStyles.eachName}>
                            <Input
                                label="First Name:"
                                value={firstName}
                                editable={false} />
                        </View>
                        <View style={signupStyles.eachName}>
                            <Input
                                label="Last Name:"
                                value={lastName}
                                editable={false} />
                        </View>
                    </View>
                    <View style={[signupStyles.formPadding, { paddingHorizontal: moderateScale(16) }]}>
                        <Input
                            label="Email:"
                            value={email}
                            editable={false} />
                    </View>
                    <View style={[signupStyles.formPadding, { paddingHorizontal: moderateScale(16) }]}>
                        <Input
                            label="Address:"
                            value={address}
                            editable={false} />
                    </View>
                    {
                        mode != "user" && <View style={[signupStyles.formPadding, { paddingHorizontal: moderateScale(16) }]}>
                            <Input
                                label="LGA:"
                                value={lga}
                                editable={false} />
                        </View>
                    }
                    {mode === "user" && <View style={[signupStyles.formPadding, { paddingHorizontal: moderateScale(16) }]}>
                        <Input
                            label="Matric No:"
                            value={matricNo}
                            editable={false} />
                    </View>}
                    {mode === "user" && <View style={[signupStyles.formPadding, { paddingHorizontal: moderateScale(16) }]}>
                        <Input
                            label="Faculty:"
                            value={faculty}
                            editable={false} />
                    </View>}
                    {mode === "user" && <View style={[signupStyles.formPadding, { paddingHorizontal: moderateScale(16) }]}>
                        <Input
                            label="Department:"
                            value={dept}
                            editable={false} />
                    </View>}
                    {mode === "user" && <View style={[signupStyles.formPadding, { paddingHorizontal: moderateScale(16) }]}>
                        <Input
                            label="Level:"
                            value={level}
                            editable={false} />
                    </View>}

                    <View style={{ padding: moderateScale(16), paddingTop: moderateScale(24) }}>
                        <Select text="Continue" selected selectFun={() => router.back()} />
                    </View>
                </ScrollView>
                {
                    loaderVisible ? <Loader /> : null
                }
            </SafeAreaView>
        </SafeAreaProvider>
    )
}

