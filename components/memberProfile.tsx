import { Image, Text, TouchableOpacity, View } from "react-native";
import LineBreak from "./lineBreak";
import { ScrollView } from "react-native-gesture-handler";
import Avatar from "./avatar";
import { colors, globals, roboto } from "@/styles/globals";
import { images } from "@/constants/images";
import { singleChatStyles } from "@/styles/singleChat";
import Setting from "./setting";
import { router } from "expo-router";
import { logOut } from "@/services/logOut";
import { useEffect, useState } from "react";
import Loader from "./loader";
import { toast } from "@/deps/toast";
import { getRole } from "@/deps/getRole";
import { getStudentInfo, getVendorInfo } from "@/services/getStudentInfo";


export default function MemberProfile() {

    const signOut = async () => {
        console.log("signed out")

        setLoaderVisible(true)

        const leaveProfile = await logOut()

        setLoaderVisible(false)

        if (leaveProfile[0] != "200") {
            toast("unable to sign out. try later.")
        }

        else router.replace("/auth/login")

    }

    const [loaderVisible, setLoaderVisible] = useState(false)

    const [role, setRole] = useState("")
    const [name, setName] = useState("")
    const [profileImg, setProfileImg] = useState("")

    useEffect(() => {
        const userRole = async () => {
            const mode = await getRole()
            setRole(mode)
        }
        userRole()
    }, [])

    useEffect(() => {
        const getOtherInfo = async () => {
            
            const info = (role === "user") ? await getStudentInfo() : await getVendorInfo()

            if (info[0] != "200") {
                return
            }

            const user = info[1]

            setName(`${user?.first_name ?? ""} ${user?.last_name ?? ""}`)
            setProfileImg(`${user?.kyc_data?.profile_img?.url ?? ""}`)
        }

        getOtherInfo()
    }, [role])

    return (
        <ScrollView style={{ flex: 1 }}>
            <View style={[singleChatStyles.row, singleChatStyles.jCenter, globals.authContainer]}>
                <TouchableOpacity onPress={() => router.push("/pages/profileDetails")} style={[singleChatStyles.row, singleChatStyles.gap]}>
                    <Avatar img={profileImg ?? ""} />
                    <View>
                        <Text style={roboto.titleSmallBold}>{name}</Text>
                        <Text style={[roboto.bodySmall, colors.darkBurntOrange]}>{role === "user" ? "Student" : "Premium Member"}</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity>
                    <Image source={images.bell} style={[singleChatStyles.img]} />
                </TouchableOpacity>
            </View>
            <LineBreak />
            <View style={globals.authContainer}>
                <Text style={[roboto.bodySmall, colors.grays]}>My uFinda account</Text>
                <Setting setting="Update Kyc" kyc icon settingFun={() => router.push("/pages/updateKyc")} />
                <Setting setting="Make money" icon settingFun={() => toast("Coming soon")} />
                <Setting setting="FAQ" icon settingFun={() => router.push("/pages/faqs")} />
            </View>
            <LineBreak />
            <View style={globals.authContainer}>
                <Text style={[roboto.bodySmall, colors.grays]}>Settings</Text>
                <Setting setting="Personal information" icon settingFun={() => router.push("/pages/userInfo")} />
                <Setting setting="Language" value="English" />
                <Setting setting="About uFinda" icon settingFun={() => router.push("/pages/faqs")} />
                <Setting setting="Change password" icon settingFun={() => toast("Coming Soon")} />
                <Setting setting="Theme" icon value="Device theme" />
                <TouchableOpacity onPress={signOut}>
                    <Text style={[roboto.bodyMedium, colors.foundationWarningDark, singleChatStyles.settings]}>Sign out</Text>
                </TouchableOpacity>
            </View>

            {
                loaderVisible ? <Loader /> : null
            }

        </ScrollView>
    )
}
