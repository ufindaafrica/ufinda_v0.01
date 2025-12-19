import ChatAppHeader from "@/components/chatAppHeader";
import LineBreak from "@/components/lineBreak";
import Plus from "@/components/plus";
import { dummyHostels } from "@/constants/dummy_data";
import { images } from "@/constants/images";
import { getAllChats } from "@/services/allChats";
import { chatStyles } from "@/styles/chat";
import { colors, globals, roboto } from "@/styles/globals";
import { router, useFocusEffect } from "expo-router";
import { getItemAsync } from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { Image, ImageBackground, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type VendorChatProps = {
    student?: boolean
}

type Chat = {
    id?: string,
    buyer_id?: string,
    vendor_id?: string,
    product_id?: string,
    unread_count?: number,
    messages?: Array<LastMessage>,
    sender_profile_pic?: any | null
}

type LastMessage = {
    content?: string,
    message_type?: string,
    public_id?: string | null,
    created_at?: string,
    sender_id?: string,
    is_read?: boolean
}

export default function VendorChat({ student }: VendorChatProps) {

    const [activated, setActivated] = useState("All")
    const [allChats, setAllChats] = useState<Array<Chat>>([])
    const [myId, setMyId] = useState("")

    const currentChats = () => {
        // if (activated === "Unread") return allChats.filter(item => item?.messages?)
        // if (activated === "Read" || activated === "Sent") return allChats.filter(item => item?.messages)
        return allChats
    }

    useEffect(() => {
        setAllChats(currentChats())
    }, [activated])

    useEffect(() => {
        // setAllChats(currentChats())

        const loadId = async () => {
            const id = await getItemAsync('ID')
            console.log(id)
            setMyId(id ?? "1234")
        }

        loadId()
    }, [])

    useFocusEffect(useCallback(() => {
        const getChats = async () => {
            const everyChat = (await getAllChats())[1]
            setAllChats(everyChat)
            console.log("all chats =>", everyChat)
        }

        getChats()
    }, []))

    const getAgentName = (id: string) => {
        const hostel = dummyHostels.find(h => h.agent.id === id)
        return hostel?.agent.name ?? ""
    }

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
                    allChats?.map((item, idx) =>
                        <TouchableOpacity onPress={() => {
                            const chatPersonId = myId === item.buyer_id ? item.vendor_id : item.buyer_id
                            router.push({
                                pathname: "/pages/singleChat",
                                params: {
                                    id: item.id,
                                    vendor_id: chatPersonId
                                }
                            })
                        }} key={idx} style={chatStyles.padding}>
                            <View style={chatStyles.eachChatV}>
                                <ImageBackground source={images.laptop} style={chatStyles.laptopV}>
                                    {item?.sender_profile_pic ? <Image source={item?.sender_profile_pic} style={chatStyles.profileImg} /> : <View style={[chatStyles.profileImg, chatStyles.nullPic]}>
                                        <Text style={[roboto.mediumEmphasized, colors.white]}>{myId == item?.buyer_id ? (getAgentName(item?.vendor_id ?? "")).charAt(0) : item?.buyer_id?.charAt(0) ?? ""}</Text></View>}
                                </ImageBackground>
                                <View style={chatStyles.chatRightV}>
                                    <View>
                                        <Text style={roboto.bodyLargeBold}>{getAgentName(item?.vendor_id ?? "")}</Text>
                                        <View style={chatStyles.tickV}>
                                            <Image source={item?.messages ? images.onetick : images.twoticks} style={chatStyles.tick} />
                                            <Text>{item?.messages?.[0]?.content ?? ""}</Text>
                                        </View>
                                    </View>
                                    <View>
                                        <Text style={[roboto.caption, item?.messages && colors.foundationWarningDark]}>{item?.messages?.[0]?.created_at ? (new Date(item?.messages[0].created_at)).toDateString() : ""}</Text>
                                        {item?.unread_count ? <View style={chatStyles.unread}><Text style={[roboto.caption, colors.white]}>
                                            {item?.messages?.[0]?.content ?? ""}</Text></View> : null}
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>)
                }
            </ScrollView>

        </SafeAreaView>
    )
}
