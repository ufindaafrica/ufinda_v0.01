import Avatar from "@/components/avatar";
import BackArrow from "@/components/back";
import Message from "@/components/message";
import { dummyHostels } from "@/constants/dummy_data";
import { images } from "@/constants/images";
import { verticalScale } from "@/deps/scale";
import { BARE_URL, getAccessToken } from "@/services/apiConstants";
import { getChatMessages } from "@/services/chatMes";
import { colors, globals, roboto } from "@/styles/globals";
import { singleChatStyles } from "@/styles/singleChat";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { getItemAsync } from "expo-secure-store";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Keyboard, KeyboardAvoidingView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Message = {
    content: string,
    created_at: Date,
    sender_id?: string,
    is_read?: boolean,
    personal?: boolean,
    last?: boolean
}

export default function SingleChat() {

    const { id } = useLocalSearchParams()
    const { vendor_id } = useLocalSearchParams()
    const vendorIdString = Array.isArray(vendor_id) ? vendor_id[0] : vendor_id

    const [message, setMessage] = useState("")
    const [allMessages, setAllMessages] = useState<Array<Message>>([])

    const [userToken, setUserToken] = useState("")
    const [chatUrl, setChatUrl] = useState("")
    const chatSocket = useRef<WebSocket | null>(null)
    const [userId, setUserId] = useState("")

    useFocusEffect(useCallback(() => {
        let active = true

        const joinChatRoom = async () => {
            
            const token = await getAccessToken()
            if (!token || !active) return

            const url = `wss://${BARE_URL}/ws/chat?token=${token}`
            const chatS = new WebSocket(url)
            chatSocket.current = chatS

            chatS.onopen = () => {
                console.log("in chat socket, about to connect")
                chatS.send(JSON.stringify({
                    type: "join_room",
                    payload: {
                        room_id: id
                    }
                }))
                console.log("chat joined")
            }

            chatS.onmessage = (event) => {
                const msg = JSON.parse(event.data)
                console.log(msg)
                if (msg.type === "message") {
                    setAllMessages(prev => [...prev, msg.payload])
                }
            }

            chatS.onerror = (error) => {
                console.error("websocket error: ", error)
            }

            chatS.onclose = () => {
                chatSocket.current = null
            }
        }

        joinChatRoom()

        return () => {
            active = false
            chatSocket.current?.send(JSON.stringify({
                type: 'leave_room',
                payload: {
                    room_id: id
                }
            }))
            chatSocket.current?.close()
            chatSocket.current = null
        }
    }, [id]))

    const sendMessage = async (message: string) => {
        const newMessage = {
            content: message,
            message_type: "text",
            created_at: new Date(),
            personal: true,
        }

        chatSocket.current?.send(JSON.stringify({
            type: "message",
            payload: {
                room_id: id,
                content: newMessage.content,
                message_type: "text"
            }
        }))

        setAllMessages(prev => {
            const messages = [...prev]
            messages.push(newMessage)
            return messages
        })

        Keyboard.dismiss()
        setMessage("")
    }

    useEffect(() => {
        const getMessages = async () => {
            const storedId = await getItemAsync("ID") ?? ""
            setUserId(storedId)

            const idString = Array.isArray(id) ? id[0] : id
            const mes = await getChatMessages({ room_id: idString })
            if (mes[0] == "200") {
                setAllMessages(mes[1])
            }
        }

        getMessages()
    }, [])

    const getAgentName = (id: string) => {
        const hostel = dummyHostels.find(h => h.agent.id === id)
        return hostel?.agent.name ?? ""
    }

    return (
        <SafeAreaView style={[globals.container, globals.lightContainer]}>

            <View style={[singleChatStyles.row, singleChatStyles.jCenter, globals.authContainer]}>
                <View style={singleChatStyles.row}>
                    <BackArrow backFun={() => router.back()} />
                    <View style={[singleChatStyles.row, singleChatStyles.gap]}>
                        <Avatar />
                        <View>
                            <Text style={[roboto.titleSmallBold, singleChatStyles.bottomPadding]}>{getAgentName(vendorIdString)}</Text>
                            <Text style={roboto.caption}>Online</Text>
                        </View>
                    </View>
                </View>
                <View style={[singleChatStyles.row, singleChatStyles.jCenter, singleChatStyles.headerRight]}>
                    <TouchableOpacity>
                        <Image source={images.outlineCall} style={singleChatStyles.img} />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Image source={images.more} style={singleChatStyles.img} />
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView style={singleChatStyles.kAView} behavior="padding" keyboardVerticalOffset={verticalScale(5)}>
                <ScrollView>
                    <Text style={[roboto.bodySmall, colors.darkBurntOrange, singleChatStyles.encrypted]}>Messages are encrypted</Text>

                    {
                        allMessages.map((item, idx) =>
                            <Message key={idx} message={item.content} personal={item.personal ? item.personal : item.sender_id === userId ? true : false} last={item.last} time={item.created_at ? new Date(item.created_at).toTimeString().slice(0, 5) : ""} />)
                    }

                </ScrollView>

                <View style={[singleChatStyles.row, singleChatStyles.jCenter, singleChatStyles.gap, { paddingVertical: 16 }]}>
                    <View style={[globals.lightContainer, singleChatStyles.messageBox, singleChatStyles.row, singleChatStyles.jCenter, singleChatStyles.messageBoxHeight]}>
                        <View style={[singleChatStyles.row, singleChatStyles.gap]}>
                            <Image source={images.emoji} style={singleChatStyles.smallImg} />
                            <TextInput
                                style={[singleChatStyles.messageBoxHeight, roboto.bodySmall, singleChatStyles.input]}
                                multiline
                                value={message}
                                onChangeText={(text) => { setMessage(text) }} />
                        </View>
                        <TouchableOpacity>
                            <Image source={images.camera} style={singleChatStyles.smallImg} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => message && sendMessage(message)} style={[singleChatStyles.sendView]}>
                        <Image source={message ? images.send : images.mic} style={singleChatStyles.smallImg} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
