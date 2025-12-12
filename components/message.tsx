import { colors, roboto } from "@/styles/globals";
import { singleChatStyles } from "@/styles/singleChat";
import { Text, View } from "react-native";

type MessageProps = {
    message: string,
    time?: string,
    last?: boolean,
    status?: boolean,
    personal?: boolean
}

export default function Message ({ message, time, last, status, personal }: MessageProps) {

    return (
        <View>
                <Text style={[roboto.bodyMedium, personal ? singleChatStyles.message : singleChatStyles.reversed, personal ? colors.white : colors.black]}>{message}</Text>
                { 
                last ? <Text style={[roboto.caption, colors.grays, personal ? singleChatStyles.timeText : singleChatStyles.reversedTime]}>{time}{personal ? " : Seen" : null}</Text> : null
                }
        </View>
    )
}
