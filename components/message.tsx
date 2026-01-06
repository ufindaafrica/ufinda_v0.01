import { images } from "@/constants/images";
import { scale, verticalScale } from "@/deps/scale";
import { colors, roboto } from "@/styles/globals";
import { singleChatStyles } from "@/styles/singleChat";
import { useEffect, useState } from "react";
import { Image, ImageBackground, Text, TouchableOpacity, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'

type MessageProps = {
    message?: string,
    time?: string,
    last?: boolean,
    status?: boolean,
    personal?: boolean,
    type?: string,
    imageNumber?: number,
    percentUpload?: number,
    length?: number
}

export default function Message({ message, time, last, status, personal, type, imageNumber, percentUpload, length }: MessageProps) {

    const [playing, setPlaying] = useState(false)

    const player = useAudioPlayer({ uri: message });
    const playerStatus = useAudioPlayerStatus(player);
    const [playRequested, setPlayRequested] = useState(false);

    const handlePlay = () => {
        setPlayRequested(true);
    };

    useEffect(() => {
        if (playRequested && playerStatus?.isLoaded && !playerStatus.isBuffering) {
            setPlaying(true)
            player.play();
            setPlayRequested(false);
            setPlaying(false)
        }
    }, [status, playRequested]);

    return (
        <View>
            {type === "text" ? <View>
                <Text style={[roboto.bodyMedium, personal ? singleChatStyles.message : singleChatStyles.reversed, personal ? colors.white : colors.black]}>{message}</Text>
                {
                    last ? <Text style={[roboto.caption, colors.grays, personal ? singleChatStyles.timeText : singleChatStyles.reversedTime]}>{time}{status && personal ? "  Seen" : null}</Text> : null
                }
            </View> : type === "image" ? <TouchableOpacity style={[{ width: scale(150), height: scale(150), borderRadius: 16, padding: 2, borderWidth: 1, borderColor: "#546881", marginTop: verticalScale(4) }, personal && { alignSelf: 'flex-end' }]}>
                <ImageBackground source={message ? { uri: message } : images.gallery} style={[{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }, ((imageNumber ?? 0) > 0) && { opacity: 0.5 }]} resizeMode="cover" imageStyle={[{ borderRadius: 16 }, (!message) && { width: scale(48), height: scale(48), alignSelf: 'center' }]}>
                    {
                        (!message) && <View>
                            <Text style={[roboto.bodyMedium, colors.foundationPrimaryNormal]}>{`Uploading media`}</Text>
                            <Text style={[roboto.bodyMedium, colors.foundationPrimaryNormal, { alignSelf: 'center' }]}>{`${percentUpload} %`}</Text>
                        </View>
                    }
                </ImageBackground>
                {
                    last ? <Text style={[roboto.caption, colors.grays, personal ? singleChatStyles.timeText : singleChatStyles.reversedTime]}>{time}{status && personal ? "  Seen" : null}</Text> : null
                }
            </TouchableOpacity> : <TouchableOpacity onPress={() => handlePlay()} style={[{ width: scale(200), height: scale(50), borderRadius: 16, padding: 2, borderWidth: 1, borderColor: "#546881", marginTop: verticalScale(4) }, personal && { alignSelf: 'flex-end' }]}>
                <View style={{ width: '100%', height: '100%', justifyContent: 'space-around', alignItems: 'center', flexDirection: 'row' }}>
                    <Image source={playing ? images.audio : images.audioStatic} style={{ width: '85%', height: scale(40), resizeMode: 'contain'
                     }} />
                    <Text style={[roboto.bodyMedium, colors.foundationPrimaryNormal]}>{length ?? ""}</Text>
                </View>
                {
                    last ? <Text style={[roboto.caption, colors.grays, personal ? singleChatStyles.timeText : singleChatStyles.reversedTime]}>{time}{status && personal ? "  Seen" : null}</Text> : null
                }
            </TouchableOpacity>
            }
        </View>
    )
}
