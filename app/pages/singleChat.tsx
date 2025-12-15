import Avatar from "@/components/avatar";
import BackArrow from "@/components/back";
import Message from "@/components/message";
import { images } from "@/constants/images";
import { verticalScale } from "@/deps/scale";
import { getChatMessages } from "@/services/chatMes";
import { colors, globals, roboto } from "@/styles/globals";
import { singleChatStyles } from "@/styles/singleChat";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, Keyboard, KeyboardAvoidingView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Message = {
    content: string,
    created_at: Date,
    sender_id: string,
    is_read: boolean,
    personal?: boolean,
    last?: boolean
}

export default function SingleChat() {

    const { id } = useLocalSearchParams()

    // const sampleMessageList = [{
    //         content: "hi, looking for a hostel?",
    //         created_at: new Date(),
    //         sender_id: "1234",
    //         is_read: true,
    //         last: true
    //     },
    // {
    //         content: "yes, somewhere in osun",
    //         created_at: new Date(),
    //         sender_id: "1234",
    //         is_read: true,
    //         personal: true,
    //         last: true
    //     },
    //     {
    //         content: "ok, i have selfcon and a single room. if you're looking for a flat, that is also available.",
    //         created_at: new Date(),
    //         sender_id: "1234",
    //         is_read: true,
    //         last: true
    //     },
    //     {
    //         content: "alright, do you have a phone number.",
    //         created_at: new Date(),
    //         sender_id: "1234",
    //         is_read: true,
    //         personal: true
    //     },
    //     {
    //         content: "i want to call you",
    //         created_at: new Date(),
    //         sender_id: "1234",
    //         is_read: true,
    //         personal: true,
    //         last: true
    //     },
    //     {
    //         content: "call 09033445566",
    //         created_at: new Date(),
    //         sender_id: "1234",
    //         is_read: true,
    //         last: true
    //     }
    // ]

    const [message, setMessage] = useState("")
    const [allMessages, setAllMessages] = useState<Array<Message>>([])

    const sendMessage = (message: string) => {
        const newMessage = {
            content: message,
            created_at: new Date(),
            sender_id: "1234",
            is_read: true,
            personal: true,
            last: true
        }

        setAllMessages(prev => {
            const messages = [...prev]
            messages.push(newMessage)
            return messages
        })

        Keyboard.dismiss()
        setMessage("")
    }

    useFocusEffect(useCallback(() => {
        const getMessages = async () => {
            const mes = await getChatMessages({room_id: id})
            if (mes[0] == "200") {
                setAllMessages(mes[1])
            }
            console.log(mes[1])
        }

        getMessages()
    }, []))

    return (
        <SafeAreaView style={[globals.container, globals.lightContainer]}>

            <View style={[singleChatStyles.row, singleChatStyles.jCenter, globals.authContainer]}>
                <View style={singleChatStyles.row}>
                    <BackArrow backFun={() => router.back()} />
                    <View style={[singleChatStyles.row, singleChatStyles.gap]}>
                        <Avatar />
                        <View>
                            <Text style={[roboto.titleSmallBold, singleChatStyles.bottomPadding]}>Timothy Okoli</Text>
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
                        <Message key={idx} message={item.content} personal={item.personal} last={item.last} time={item.created_at.toTimeString().slice(0,5)} />)
                    }

                </ScrollView>

                <View style={[singleChatStyles.row, singleChatStyles.jCenter, singleChatStyles.gap, {paddingVertical: 16}]}>
                    <View style={[globals.lightContainer, singleChatStyles.messageBox, singleChatStyles.row, singleChatStyles.jCenter, singleChatStyles.messageBoxHeight]}>
                        <View style={[singleChatStyles.row, singleChatStyles.gap]}>
                            <Image source={images.emoji} style={singleChatStyles.smallImg} />
                            <TextInput 
                                style={[singleChatStyles.messageBoxHeight, roboto.bodySmall, singleChatStyles.input]}
                                multiline
                                value={message}
                                onChangeText={(text) => {setMessage(text)}}/>
                        </View>
                        <TouchableOpacity>
                            <Image source={images.camera} style={singleChatStyles.smallImg} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => message && sendMessage(message)} style={[singleChatStyles.sendView]}>
                        <Image source={message ? images.send : images.mic} style={singleChatStyles.smallImg}/>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
