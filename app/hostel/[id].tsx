import BackArrow from "@/components/back";
import Select from "@/components/select";
import { dummyHostels, DummyHostelsType } from "@/constants/dummy_data";
import { images } from "@/constants/images";
import { idStyles } from "@/styles/id";
import { router, useLocalSearchParams } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { useEffect, useState } from "react";


export default function HostelDetails() {

    const { id } = useLocalSearchParams()
    const hostelDetails: DummyHostelsType | undefined = dummyHostels.find(hostel => hostel.id === id)

    const hostelImages = hostelDetails?.images
    const imgLen = hostelDetails?.images.length

    const [ currentImage, setCurrentImg ] = useState(hostelImages?.[0])
    const [ idx, setIdx ] = useState(0)

    const onSwipeLeft = () => {
        if (idx <= 0) {
            return
        } else {
            setIdx(idx - 1)
            return
        }
    }

    const onSwipeRight = () => {
        if ( imgLen ? idx >= (imgLen - 1) : null) {
            return
        } else {
            setIdx(idx + 1)
            return
        }
    }

    useEffect(() => {
        console.log("idx", idx)
        setCurrentImg(hostelImages?.[idx])
    }, [idx])

    return (
        <SafeAreaProvider>
            <SafeAreaView style={idStyles.safeV}>

                <View style={idStyles.headerV}>
                    <View style={idStyles.firstHeaderV}>
                        <BackArrow backFun={() => router.back()} />
                        <Text style={idStyles.headerTxt}>{hostelDetails?.name}</Text>
                    </View>
                    <Image source={images.more} />
                </View>

                <Swipeable containerStyle={idStyles.swipeV} onSwipeableOpen={
                    (direction) => {
                        if (direction === "left") onSwipeRight()
                        else if (direction === "right") onSwipeLeft()
                    }
                }
                renderLeftActions={() => <View style={{width: 1}} />}
                renderRightActions={() => <View style={{width: 1}} />}>
                    <View style={idStyles.picV}>
                        <Image source={currentImage} style={idStyles.hostelImg} />
                        <View style={idStyles.galleryV}>
                            <Text style={idStyles.galleryTxt}>{hostelDetails?.images.length}</Text>
                            <Image source={images.gallery} />
                        </View>
                    </View>
                </Swipeable>

                <View style={idStyles.prelimV}>
                    <View style={idStyles.topPrelimV}>
                        <View style={idStyles.firstTopPrelimV}>
                            <Text style={idStyles.regTxt}>Room Self Contained</Text>
                            <Image source={images.archiveAdd} />
                        </View>
                        <View style={idStyles.firstTopPrelimV}>
                            <Text style={[idStyles.regTxt, idStyles.boldTxt]}>₦ {hostelDetails?.price} / year</Text>
                            <Text style={[idStyles.regTxt, idStyles.redTxt]}>4 rooms left</Text>
                        </View>
                        <View style={[idStyles.firstTopPrelimV]}>
                            <TouchableOpacity style={idStyles.thirdTopPrelimV}>
                                <Select text="Call" icon={images.call} selected />
                            </TouchableOpacity>
                            <TouchableOpacity style={idStyles.thirdTopPrelimV}>
                                <Select text="Book on uFinda" selected={false} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View></View>

                <View></View>

            </SafeAreaView>
        </SafeAreaProvider>
    )

}
