import ChatAppHeader from "@/components/chatAppHeader";
import LineBreak from "@/components/lineBreak";
import Plus from "@/components/plus";
import { chats, chatsType } from "@/constants/dummy_chats";
import { images } from "@/constants/images";
import { chatStyles } from "@/styles/chat";
import { colors, globals, roboto } from "@/styles/globals";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ImageBackground, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type VendorChatProps = {
    student?: boolean
}

export default function VendorChat({ student }: VendorChatProps) {

    const [activated, setActivated] = useState("All")
    const [allChats, setAllChats] = useState<Array<chatsType>>([])

    const currentChats = () => {
        if (activated === "Unread") return chats.filter(item => item.unread)
        if (activated === "Read" || activated === "Sent") return chats.filter(item => !item.unread)
        return chats
    }

    useEffect(() => {
        setAllChats(currentChats())
    }, [activated])

    useEffect(() => {
        setAllChats(currentChats())
    }, [])

    return (
        <SafeAreaView style={[globals.container, globals.lightContainer]}>
            {
                !student && <Plus />
            }

            <View style={[chatStyles.padding]}>
                <ChatAppHeader />
            </View>

            <View style={chatStyles.chatOptionsV}>
                {
                    ["All", "Unread", "Read", "Sent"].map((item, idx) =>
                        <TouchableOpacity onPress={() => setActivated(item)} key={idx} style={[chatStyles.eachOption, (activated === item) && chatStyles.activated]}>
                            <Text style={[roboto.bodyMedium, colors.foundationPrimaryNormal, (activated === item) && colors.white]}>{item}</Text>
                        </TouchableOpacity>)
                }
            </View>

            <ScrollView contentContainerStyle={chatStyles.scrollV}>
                <LineBreak />

                {
                    allChats.map((item, idx) =>
                        <TouchableOpacity onPress={() => router.push("/pages/singleChat")} key={idx} style={chatStyles.padding}>
                            <View style={chatStyles.eachChatV}>
                                <ImageBackground source={images.laptop} style={chatStyles.laptopV}>
                                    {item.profile_pic ? <Image source={item.profile_pic} style={chatStyles.profileImg} /> : <View style={[chatStyles.profileImg, chatStyles.nullPic]}>
                                        <Text style={[roboto.mediumEmphasized, colors.white]}>{item.name.charAt(0)}</Text></View>}
                                </ImageBackground>
                                <View style={chatStyles.chatRightV}>
                                    <View>
                                        <Text style={roboto.bodyLargeBold}>{item.name}</Text>
                                        <View style={chatStyles.tickV}>
                                            <Image source={item.unread ? images.onetick : images.twoticks} style={chatStyles.tick} />
                                            <Text>demo of the message</Text>
                                        </View>
                                    </View>
                                    <View>
                                        <Text style={[roboto.caption, item.unread && colors.foundationWarningDark]}>{item.last_mes_date.toLocaleTimeString()}</Text>
                                        {item.unread ? <View style={chatStyles.unread}><Text style={[roboto.caption, colors.white]}>
                                            {item.unread_mes}</Text></View> : null}
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>)
                }
            </ScrollView>

        </SafeAreaView>
    )
}
