import { View, TouchableOpacity } from "react-native";
import { idStyles } from "@/styles/id";
import { images } from "@/constants/images";
import { VideoView, useVideoPlayer } from "expo-video"
import { useState } from "react";
import Loader from "./loader";
import { scale } from "@/deps/scale";
import { Image } from "expo-image"

type MediaProps = {
    media: any,
    video?: boolean,
    close?: (value: any) => void,
    left: () => void,
    right: () => void,
    idx: any,
    imgLen: any
}

export default function Media({ media, video, close, left, right, idx, imgLen }: MediaProps) {

    const [ready, setReady] = useState(false)

    const videoPlayer = useVideoPlayer(media, player => {
        player.loop = true;
        player.addListener("statusChange", ({ status }) => {
            if (status === "readyToPlay" && !player.playing) {
                setReady(true)
                player.play()
            }
        })
    })

    return (
        <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: "100%", backgroundColor: 'rgba(240, 240, 240, 0.9)' }}>
            {
                video ? ready ? <VideoView
                    player={videoPlayer}
                    contentFit="contain"
                    nativeControls={true}
                    style={{ width: "100%", height: "100%" }} /> : <Loader />
                    : <Image
                        source={{ uri: media }}
                        contentFit="contain"
                        cachePolicy="disk"
                        style={{ width: "100%", height: "100%" }} />
            }
            <TouchableOpacity onPress={left} disabled={idx <= 0} style={[{ position: 'absolute', left: 10, top: '50%', padding: 5 }, idx <= 0 && idStyles.disabledArrow]}>
                <Image source={images.galleryLeft} style={[idStyles.navImg]} />
            </TouchableOpacity>
            <TouchableOpacity onPress={right} disabled={imgLen ? idx >= (imgLen - 1) : false} style={[{ position: 'absolute', right: 10, top: '50%', padding: 5 }, (imgLen ? idx >= (imgLen - 1) : false) && idStyles.disabledArrow]}>
                <Image source={images.galleryRight} style={[idStyles.navImg]} />
            </TouchableOpacity>

            <TouchableOpacity onPress={close} style={{position: 'absolute', top: 20, right: 20, zIndex: 10}}>
                <Image source={images.close} style={{ width: scale(56), height: scale(56)}} />
            </TouchableOpacity>
        </View>
    )
}

