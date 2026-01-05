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
import ErrorModal from "./errorModal";
import { toast } from "@/deps/toast";


export default function MemberProfile() {

    const signOut = async () => {

        setLoaderVisible(true)

        const leaveProfile = await logOut()

        setLoaderVisible(false)

        if (leaveProfile[0] != "200") {
            toast("unable to sign out. try later.")
        }

        else router.replace("/auth/login")
        
    }

    const [loaderVisible, setLoaderVisible] = useState(false)

    return (
        <ScrollView style={{ flex: 1 }}>
            <View style={[singleChatStyles.row, singleChatStyles.jCenter, globals.authContainer]}>
                <TouchableOpacity onPress={() => router.push("/pages/profileDetails")} style={[singleChatStyles.row, singleChatStyles.gap]}>
                    <Avatar img="" />
                    <View>
                        <Text style={roboto.titleSmallBold}>Timothy Okoli</Text>
                        <Text style={[roboto.bodySmall, colors.darkBurntOrange]}>Premium member</Text>
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
                <Setting setting="Make money" icon />
                <Setting setting="FAQ" icon />
            </View>
            <LineBreak />
            <View style={globals.authContainer}>
                <Text style={[roboto.bodySmall, colors.grays]}>Settings</Text>
                <Setting setting="Personal information" icon />
                <Setting setting="Language" value="English" />
                <Setting setting="About uFinda" icon />
                <Setting setting="Change password" icon />
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
