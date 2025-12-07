import { images } from "@/constants/images";
import { globals } from "@/styles/globals";
import { useCallback, useEffect, useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { GiftedChat } from 'react-native-gifted-chat'
import { View } from "react-native";


export default function SingleChat() {

    const [messages, setMessages] = useState([])
    const insets = useSafeAreaInsets()

    // useEffect(() => {
    //     setMessages([
    //         {
    //             _id: 1,
    //             text: 'Hello developer',
    //             createdAt: new Date(),
    //             user: {
    //                 _id: 2,
    //                 name: 'John Doe',
    //                 avatar: 'https://placeimg.com/140/140/any',
    //             },
    //         },
    //     ])
    // }, [])

    const onSend = useCallback((messages = []) => {
        setMessages(previousMessages =>
            GiftedChat.append(previousMessages, messages)
        )
    }, [])

    return (
        <SafeAreaView style={[globals.container, globals.authContainer]}>

            <GiftedChat 
                messages={messages}
                onSend={messages => onSend(messages)}
                user={{
                    _id: 1
                }}/>

        </SafeAreaView>
    )
}
