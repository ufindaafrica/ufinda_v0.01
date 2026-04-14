import AppHeader from "@/components/appHeader";
import ChatAppHeader from "@/components/chatAppHeader";
import LineBreak from "@/components/lineBreak";
import Plus from "@/components/plus";
import { images } from "@/constants/images";
import { lastMessageSentTime } from "@/deps/chatTime";
import { getRole } from "@/deps/getRole";
import { getAgentInfo } from "@/services/agentInfo";
import { getAllChats } from "@/services/allChats";
import { getStudentInfo, getVendorInfo } from "@/services/getStudentInfo";
import { chatStyles } from "@/styles/chat";
import { colors, globals, roboto } from "@/styles/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
    last_message?: LastMessage,
    sender_profile_pic?: any | null
}

type LastMessage = {
    content?: string,
    message_type?: string,
    public_id?: string | null,
    created_at?: string,
    sender_id?: string,
    is_read?: boolean,
    id?: string
}

export type ChatMate = {
    name: string,
    profile_img: string,
    phone_number: string,
    id: string
}

export default function VendorChat({ student }: VendorChatProps) {

    const [activated, setActivated] = useState("All")
    const [allChats, setAllChats] = useState<Array<Chat>>([])
    const [myId, setMyId] = useState("")
    const [chatMateInfos, setChatMateInfos] = useState<Array<ChatMate>>([])
    const [role, setRole] = useState("")

    const [reload, setReload] = useState(false)
    // useFocusEffect(useCallback(() => {
    //     setReload(!reload)
    // }, []))

    const currentChats = () => {
        // if (activated === "Unread") return allChats.filter(item => (item.last_message?.is_read == false && item.last_message?.sender_id !== myId))

        // if (activated === "Read") return allChats.filter(item => item.last_message?.is_read == true && item.last_message?.sender_id === myId)

        // if (activated === "Sent") return allChats.filter(item => item.last_message?.sender_id === myId)

        return allChats
    }

    useFocusEffect(useCallback(() => {

        const loadId = async () => {
            const id = await getItemAsync('ID')
            setMyId(id ?? "")
            setReload(!reload)
        }

        loadId()
    }, []))


    const chatMateInfo = async (chatMateId: string) => {
        const chatMate = chatMateId.startsWith("usr") ? await getStudentInfo() : await getAgentInfo(chatMateId)
        const chatMateDat = chatMateId.startsWith("usr") ? chatMate?.[1] : chatMate?.[1]?.[0]?.vendor_info
        const chatMateData: ChatMate = {
            name: `${chatMateDat?.first_name ?? ""} ${chatMateDat?.last_name ?? ""}`,
            profile_img: chatMateId.startsWith("usr") ? chatMateDat?.kyc_data?.profile_img?.url ?? "" : chatMateDat?.vendor_kyc?.profile_img?.url ?? "",
            phone_number: chatMateDat?.phone ?? "",
            id: chatMateId
        }
        console.log("final data =>", chatMateData)
        setChatMateInfos(prev => {
            const old = [...prev]
            old.push(chatMateData)
            return old
        })
    }

    useFocusEffect(useCallback(() => {
        const getChats = async () => {
            if (!myId) return

            let everyChat = []

            const storedChats = JSON.parse(await AsyncStorage.getItem('ALL_CHATS') ?? "[]")

            if (storedChats.length == 0) {
                everyChat = (await getAllChats())[1] ?? []
                await AsyncStorage.setItem('ALL_CHATS', JSON.stringify(everyChat))
            } else {
                everyChat = storedChats
            }

            console.log(everyChat)

            const peopleInChats: Array<string> = everyChat?.map((chat: any) => chat?.buyer_id === myId ? chat?.vendor_id : chat?.buyer_id) ?? []

            await Promise.all(
                peopleInChats.map(personId => chatMateInfo(personId))
            )

            console.log(peopleInChats)
            setAllChats(everyChat ?? [])
        }

        getChats()
    }, [myId]))

    const getChatMateName = (id: string) => {
        const hostel = chatMateInfos.find(chatmate => chatmate.id == id)
        return hostel?.name ?? ""
    }

    const getChatMatePic = (id: string) => {
        const picChatMate = chatMateInfos.find(chatmate => chatmate.id == id)
        return picChatMate?.profile_img ?? ""
    }

    const getChatMateData = (id: string) => {
        const chatmate = chatMateInfos.find(chatmate => chatmate.id == id)
        return chatmate ?? {}
    }

    return (
        <SafeAreaView style={[globals.container, globals.lightContainer]}>
            {
                !student && <Plus />
            }

            <View style={[chatStyles.padding]}>
                <AppHeader hostel />
            </View>

            {/* <View style={chatStyles.chatOptionsV}>
                {
                    ["All", "Unread", "Read", "Sent"].map((item, idx) =>
                        <TouchableOpacity onPress={() => setActivated(item)} key={idx} style={[chatStyles.eachOption, (activated === item) && chatStyles.activated]}>
                            <Text style={[roboto.bodyMedium, colors.foundationPrimaryNormal, (activated === item) && colors.white]}>{item ?? ""}</Text>
                        </TouchableOpacity>)
                }
            </View> */}

            <ScrollView contentContainerStyle={chatStyles.scrollV}>
                <LineBreak />

                {
                    currentChats()?.map((item, idx) =>
                        <TouchableOpacity onPress={() => {
                            const chatPersonId = myId === item.buyer_id ? item.vendor_id : item.buyer_id
                            router.push({
                                pathname: "/pages/singleChat",
                                params: {
                                    id: item.id,
                                    vendor_id: chatPersonId,
                                    chatmate_data: JSON.stringify(getChatMateData(chatPersonId ?? ""))
                                }
                            })
                        }} key={idx} style={chatStyles.padding}>
                            <View style={chatStyles.eachChatV}>
                                <ImageBackground source={getChatMatePic(item?.vendor_id ?? "") ? { uri: getChatMatePic(item?.vendor_id ?? "") } : images.laptop} style={chatStyles.laptopV} imageStyle={chatStyles.imageV}>
                                    {item?.sender_profile_pic ? <Image source={item?.sender_profile_pic} style={chatStyles.profileImg} /> : <View style={[chatStyles.profileImg, chatStyles.nullPic]}>
                                        <Text style={[roboto.mediumEmphasized, colors.white]}>{myId == item?.buyer_id ? (getChatMateName(item?.vendor_id ?? "")).charAt(0) : item?.buyer_id?.charAt(0) ?? ""}</Text></View>}
                                </ImageBackground>
                                <View style={chatStyles.chatRightV}>
                                    <View>
                                        <Text style={roboto.bodyLargeBold}>{getChatMateName(item?.vendor_id ?? "")}</Text>
                                        <View style={chatStyles.tickV}>
                                            {
                                                (item?.unread_count ?? 0) > 0 ? null : (item?.last_message?.sender_id ?? "") === myId && <Image source={(item?.unread_count ?? 0) > 0 ? null : item?.last_message?.is_read ? images.greenTicks : images.twoticks} style={chatStyles.tick} />
                                            }
                                            <Text style={[roboto.bodySmall, colors.grays]}>{item?.last_message?.message_type === "image" ? "📸 Picture" : ((item?.last_message?.content?.length ?? 0) > 40 ? item?.last_message?.content?.slice(0, 40) + "..." : item?.last_message?.content) ?? ""}</Text>
                                        </View>
                                    </View>
                                    <View>
                                        <Text style={[roboto.caption, (item?.unread_count ?? 0) > 0 && colors.foundationWarningDark]}>{lastMessageSentTime(item?.last_message?.created_at) ?? ""}</Text>
                                        {item?.unread_count ? <View style={chatStyles.unread}><Text style={[roboto.caption, colors.white]}>
                                            {item?.unread_count ?? ""}</Text></View> : null}
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>)
                }
            </ScrollView>

        </SafeAreaView>
    )
}
