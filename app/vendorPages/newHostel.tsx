import HostelLabel from "@/components/hostelLabel";
import Input from "@/components/input";
import LineBreak from "@/components/lineBreak";
import { images } from "@/constants/images";
import { pickMedia } from "@/deps/pickImage";
import { globals, roboto } from "@/styles/globals";
import { newHostelStyles } from "@/styles/newHostel";
import { useState } from "react";
import { Alert, Image, Platform, Text,ToastAndroid,TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";


export default function NewHostel() {

    type Media = {
        media: string;
        mediaName: string | null | undefined;
        mediaType: string;
    };

    type Error = {
        error: string
    }

    const [hostelImages, setHostelImages] = useState<(Media | Error | null)[]>([
        null, null, null, null, null
    ]);

    const [hostelVideo, setHostelVideo] = useState<Media | Error | null>(null)

    const getMedia = async (type: "image" | "video", idx: number = 0) => {

        const media = await pickMedia(type)

        if ("media" in media) {
            if (type === "image") {
                setHostelImages(prev => {
                    const newList = [...prev]
                    newList[idx] = media
                    return newList
                })
            }

            if (type === "video") {
                setHostelVideo(media)
            }
        }

        else {
            const message = media.error

            if (Platform.OS === "android") {
                ToastAndroid.show(message, ToastAndroid.CENTER)
            } else {
                Alert.alert("", message)
            }
        }

    }

    return (
        <SafeAreaView style={globals.vendorContainer}>
            <View style={newHostelStyles.headerV}>
                <Text style={roboto.titleLargeBold}>Publish an Ad</Text>
                <TouchableOpacity style={newHostelStyles.moreV}>
                    <Image source={images.more} style={newHostelStyles.moreImg} />
                </TouchableOpacity>
            </View>
            <KeyboardAwareScrollView contentContainerStyle={newHostelStyles.scrollV}>
                <LineBreak />

                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Title" />
                    <Input
                        hint="ex: Example Hostel"
                    />
                </View>

                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Categories" />
                    <Input
                        hint="ex: Example Hostel"
                        value="Hostels"
                        icon={images.arrowDown}
                        editable={false}
                    />
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Add photos" />
                    <View style={newHostelStyles.hostelImgV}>
                        {
                            Array.from(hostelImages).map((item, idx) => <TouchableOpacity key={idx} style={newHostelStyles.addHostelV} onPress={() => {
                                getMedia("image", idx)
                            }}>
                                {item === null ? <Image source={images.plus} style={newHostelStyles.plusImg} /> : <Image source={{ uri: "media" in item ? item.media : images.plus }} style={newHostelStyles.hostelImg} />}
                            </TouchableOpacity>)
                        }
                    </View>
                    <View style={newHostelStyles.imgCaptionV}>
                        <Image source={images.alertCircle} style={newHostelStyles.alertCircle} />
                        <Text style={roboto.caption}>You can add up to 5 photos each not exceeding 3Mb</Text>
                    </View>
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Add videos" />
                    <TouchableOpacity style={newHostelStyles.addHostelV} onPress={() => {
                        getMedia("video")
                    }}>
                        {hostelVideo === null ? <Image source={images.plus} style={newHostelStyles.plusImg} /> : <Image source={{ uri: "media" in hostelVideo ? hostelVideo.media : images.plus }} style={newHostelStyles.hostelImg} />}
                    </TouchableOpacity>
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Address" />
                    <Input
                        hint="ex: 12, Gwani Street"
                    />
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Hostel type" />
                    <Input
                        hint="ex: Self con"
                        icon={images.arrowDown}
                        editable={false}
                    />
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Number of rooms" />
                    <Input
                        hint="ex: Self con"
                        icon={images.arrowDown}
                        editable={false}
                    />
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Total hostel rooms" />
                    <Input
                        hint="ex: Self con"
                        icon={images.arrowDown}
                        editable={false}
                    />
                </View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    )
}
