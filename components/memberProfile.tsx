import { Image, Text, TouchableOpacity, View } from "react-native";
import LineBreak from "./lineBreak";
import { ScrollView } from "react-native-gesture-handler";
import Avatar from "./avatar";
import { colors, globals, roboto } from "@/styles/globals";
import { images } from "@/constants/images";
import { singleChatStyles } from "@/styles/singleChat";
import Setting from "./setting";


export default function MemberProfile() {

    return (
        <ScrollView style={{flex: 1}}>
            <View style={[singleChatStyles.row, singleChatStyles.jCenter, globals.authContainer]}>
                <View style={[singleChatStyles.row, singleChatStyles.gap]}>
                    <Avatar />
                    <View>
                        <Text style={roboto.titleSmallBold}>Timothy Okoli</Text>
                        <Text style={[roboto.bodySmall, colors.darkBurntOrange]}>Premium member</Text>
                    </View>
                </View>
                <TouchableOpacity>
                    <Image source={images.bell} style={[singleChatStyles.img]} />
                </TouchableOpacity>
            </View>
            <LineBreak />
            <View style={globals.authContainer}>
                <Text style={[roboto.bodySmall, colors.grays]}>My uFinda account</Text>
                <Setting setting="Update Kyc" kyc icon />
                <Setting setting="Make money" icon />
                <Setting setting="FAQ" icon />
            </View>
            <LineBreak />
            <View style={globals.authContainer}>
                <Text style={[roboto.bodySmall, colors.grays]}>Settings</Text>
                <Setting setting="Personal information" icon />
                <Setting setting="Language" value="English" />
                <Setting setting="About uFinda" icon />
                <Setting setting="Change password" icon/>
                <Setting setting="Theme" icon value="Device theme"/>
                <Text style={[roboto.bodyMedium, colors.foundationWarningDark, singleChatStyles.settings]}>Sign out</Text>
            </View>
        </ScrollView>
    )
}
