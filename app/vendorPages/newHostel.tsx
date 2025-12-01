import HostelLabel from "@/components/hostelLabel";
import Input from "@/components/input";
import LineBreak from "@/components/lineBreak";
import Select from "@/components/select";
import { images } from "@/constants/images";
import { pickMedia } from "@/deps/pickImage";
import { moderateScale, scale, verticalScale } from "@/deps/scale";
import { colors, globals, roboto } from "@/styles/globals";
import { newHostelStyles } from "@/styles/newHostel";
import { useState } from "react";
import { Alert, Image, Linking, Platform, Text, ToastAndroid, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser"


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
                    <HostelLabel label="Number of rooms available" />
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
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Roomate" />
                    <Input
                        hint="yes/no"
                        icon={images.arrowDown}
                        editable={false}
                    />
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Power supply" />
                    <Input
                        hint="yes/no"
                        icon={images.arrowDown}
                        editable={false}
                    />
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Kitchen Access" />
                    <Input
                        hint="yes/no"
                        icon={images.arrowDown}
                        editable={false}
                    />
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Toilet Access" />
                    <Input
                        hint="yes/no"
                        icon={images.arrowDown}
                        editable={false}
                    />
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Landlord Resides" />
                    <Input
                        hint="yes/no"
                        icon={images.arrowDown}
                        editable={false}
                    />
                </View>
                <View style={[newHostelStyles.inputV, newHostelStyles.paddingBottom]}>
                    <View style={newHostelStyles.descriptionV}>
                        <HostelLabel label="Description" />
                        <Text style={roboto.bodyMedium}>0/350</Text>
                    </View>
                    <Input
                        hint="Hostel description"
                        icon={images.arrowDown}
                        editable={false}
                    />
                </View>
                <LineBreak />
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Rent Per Year" />
                    <Input
                        hint="eg. 150000"
                        icon={images.arrowDown}
                        editable={false}
                    />
                </View>
                <View style={newHostelStyles.inputV}>
                    <HostelLabel label="Total Price" />
                    <Input
                        hint="eg. 150000"
                        icon={images.arrowDown}
                        editable={false}
                    />
                </View>
                <View style={[newHostelStyles.inputV, newHostelStyles.paddingBottom]}>
                    <Text style={roboto.bodyMediumBold}>Bulk price</Text>
                    <Input
                        hint="Add wholesale price?"
                        icon={images.arrowDown}
                        editable={false}
                    />
                </View>
                <LineBreak />
                <View style={{ padding: moderateScale(16) }}>
                    <Text style={[roboto.bodyLargeBold, {paddingBottom: verticalScale(8)}]}>You cannot post a Hostel Ad for free</Text>
                    <TouchableOpacity style={[{justifyContent: "space-between", height: verticalScale(143), width: "100%", padding: moderateScale(13)}, {borderWidth: 2, borderColor: "#008000", borderRadius: 8}]}>
                        <Text style={roboto.titleSmallBold}>Boost with gold</Text>
                        <Text style={[roboto.bodyMedium, colors.grays]}>Best choice if you need fast sale. Your ad will be at the top of search results and get 15X more traffic.</Text>
                        <View style={newHostelStyles.descriptionV}>
                            <View style={[newHostelStyles.descriptionV, {gap: scale(8)}]}>
                                <View style={{ width: scale(89) }}>
                                    <Select text="7 days" selected icon={images.whiteTick} />
                                </View>
                                <View style={{ width: scale(89) }}>
                                    <Select text="1 month" selected={false} />
                                </View>
                            </View>
                            <View>
                                <Text style={roboto.bodyLargeBold}>₦2,999</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={[{justifyContent: "space-between", height: verticalScale(87), width: "100%", padding: moderateScale(13), marginVertical: verticalScale(8)}, {borderWidth: 1, borderColor: "#e5e5ea", borderRadius: 8}]}>
                        <Text style={roboto.titleSmallBold}>Boost with Diamond</Text>
                        <View style={newHostelStyles.descriptionV}>
                            <Text style={roboto.titleSmall}>1 month</Text>
                            <Text style={roboto.bodyLargeBold}>₦19,999</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <LineBreak />

                <View style={{padding: moderateScale(16), rowGap: verticalScale(8)}}>
                    <Select text="Post Ad" selected />
                    <Select text="Add to drafts" selected={false} />
                    <Text style={[roboto.caption, colors.grays]}>By clicking on the post Ad, you accept the <Text style={[colors.foundationWarningDark, {textDecorationLine: "underline"}]} onPress={() => {WebBrowser.openBrowserAsync("https://google.com")}}>terms of use</Text>, confirm that you will abide by the safety tips, and declare that this Ad does not violate our <Text style={[colors.foundationWarningDark, {textDecorationLine: "underline"}]} onPress={() => {WebBrowser.openBrowserAsync("https://google.com")}}>safety policy.</Text></Text>
                </View>

            </KeyboardAwareScrollView>
        </SafeAreaView>
    )
}
