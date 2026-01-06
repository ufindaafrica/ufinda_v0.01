import Avatar from "@/components/avatar";
import BackArrow from "@/components/back";
import Message from "@/components/message";
import { dummyHostels } from "@/constants/dummy_data";
import { images } from "@/constants/images";
import { isLast, isLastInGroup } from "@/deps/chatTime";
import { verticalScale } from "@/deps/scale";
import { BARE_URL, getAccessToken } from "@/services/apiConstants";
import { getChatMessages } from "@/services/chatMes";
import { markAsRead } from "@/services/markRead";
import { colors, globals, roboto } from "@/styles/globals";
import { singleChatStyles } from "@/styles/singleChat";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { getItemAsync } from "expo-secure-store";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Keyboard, KeyboardAvoidingView, Linking, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type Message = {
    content: string,
    created_at: Date,
    sender_id?: string,
    is_read?: boolean,
    personal?: boolean,
    last?: boolean,
    id?: string,
    message_type?: string,
    public_id?: string
}

export default function SingleChat() {

    const params = useLocalSearchParams()
    const id = params.id
    const vendorIdString = Array.isArray(params.vendor_id) ? params.vendor_id[0] : params.vendor_id
    const bookString = Array.isArray(params.book) ? params.book[0] : params.book 
    const vendor = Array.isArray(params.vendor_data) ? params.vendor_data[0] : params.vendor_data
    const vendorData = vendor ? JSON.parse(vendor) : null

    const messageRef = useRef<TextInput>(null)

    useEffect(() => {
        setMessage(bookString)
        messageRef.current?.focus()
    }, [params.book])

    const [message, setMessage] = useState("")
    const [allMessages, setAllMessages] = useState<Array<Message>>([])

    const [userToken, setUserToken] = useState("")
    const [chatUrl, setChatUrl] = useState("")
    const chatSocket = useRef<WebSocket | null>(null)
    const [userId, setUserId] = useState("")

    const scrollViewRef = useRef<ScrollView>(null)

    useFocusEffect(useCallback(() => {
        let active = true

        const joinChatRoom = async () => {

            const token = await getAccessToken()
            if (!token || !active) return

            const url = `wss://${BARE_URL}/ws/chat?token=${token}`
            const chatS = new WebSocket(url)
            chatSocket.current = chatS

            chatS.onopen = () => {
                chatS.send(JSON.stringify({
                    type: "join_room",
                    payload: {
                        room_id: id
                    }
                }))
            }

            chatS.onmessage = (event) => {
                const msg = JSON.parse(event.data)
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

        const markRead = async () => {
            await markAsRead({room_id: id})
        }

        joinChatRoom()
        markRead()

        return () => {
            active = false

            const socket = chatSocket.current
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                type: 'leave_room',
                payload: {
                    room_id: id
                }
            }))
            socket.close() 
            }
            
            chatSocket.current = null
        }
    }, [id]))

    const sendMessage = async (message: string) => {

        const newMessage = {
            content: message,
            message_type: "text",
            created_at: new Date(),
            personal: true,
            sender_id: userId
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
            const messages = [...prev, newMessage]
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

    useFocusEffect(useCallback(() => {
        const setId = async () => {
            const storedId = await getItemAsync("ID") ?? ""
            setUserId(storedId)
        }
        setId()
    }, []))

    const getAgentName = (id: string) => {
        const hostel = dummyHostels.find(h => h.agent.id === id)
        return hostel?.agent.name ?? ""
    }

    useEffect(() => {
        const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
            scrollViewRef.current?.scrollToEnd({ animated: true })
        })

        return () => keyboardDidShow?.remove()
    }, [])

    

    return (
        <SafeAreaView style={[globals.container, globals.lightContainer]}>

            <View style={[singleChatStyles.row, singleChatStyles.jCenter, globals.authContainer]}>
                <View style={singleChatStyles.row}>
                    <BackArrow backFun={() => router.back()} />
                    <View style={[singleChatStyles.row, singleChatStyles.gap]}>
                        <Avatar img={vendorData?.profile_img} />
                        <View>
                            <Text style={[roboto.titleSmallBold, singleChatStyles.bottomPadding]}>{vendorData?.name ?? ""}</Text>
                            <Text style={roboto.caption}>Active recently</Text>
                        </View>
                    </View>
                </View>
                <View style={[singleChatStyles.row, singleChatStyles.jCenter, singleChatStyles.headerRight]}>
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${vendorData.phone_number}`)}>
                        <Image source={images.outlineCall} style={singleChatStyles.img} />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Image source={images.more} style={singleChatStyles.img} />
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView style={singleChatStyles.kAView} behavior="padding" keyboardVerticalOffset={verticalScale(5)}>
                <ScrollView
                    ref={scrollViewRef}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{paddingBottom: 10}}>

                    <Text style={[roboto.bodySmall, colors.darkBurntOrange, singleChatStyles.encrypted]}>Messages are encrypted</Text>

                    {
                        allMessages.map((item, idx) =>
                            <Message key={idx} message={item.content} personal={item.personal ? item.personal : item.sender_id === userId ? true : false} last={isLastInGroup(idx, allMessages)} time={item.created_at ? new Date(item.created_at).toTimeString().slice(0, 5) : ""} status={isLast(idx, allMessages) && item.is_read} />)
                    }

                </ScrollView>

                <View style={[singleChatStyles.row, singleChatStyles.jCenter, singleChatStyles.gap, { paddingVertical: 16 }]}>
                    <View style={[globals.lightContainer, singleChatStyles.messageBox, singleChatStyles.row, singleChatStyles.jCenter, singleChatStyles.messageBoxHeight]}>
                        <View style={[singleChatStyles.row, singleChatStyles.gap]}>
                            <Image source={images.emoji} style={singleChatStyles.smallImg} />
                            <TextInput
                                ref={messageRef}
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
