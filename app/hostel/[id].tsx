import BackArrow from "@/components/back";
import Select from "@/components/select";
import { dummyHostels, DummyHostelsType } from "@/constants/dummy_data";
import { images } from "@/constants/images";
import { idStyles } from "@/styles/id";
import { router, useLocalSearchParams } from "expo-router";
import { Image, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { useEffect, useState } from "react";
// import { ScrollView } from "react-native-gesture-handler";


export default function HostelDetails() {

    const { id } = useLocalSearchParams()
    const hostelDetails: DummyHostelsType | undefined = dummyHostels.find(hostel => hostel.id === id)

    const hostelImages = hostelDetails?.images
    const imgLen = hostelDetails?.images.length

    const [currentImage, setCurrentImg] = useState(hostelImages?.[0])
    const [idx, setIdx] = useState(0)

    const amenities = {
        "duplex": images.duplex,
        "bathroom": images.bath,
        "24 hrs power": images.light,
        "bedroom": images.bed,
        // "duplex1": images.duplex,
        // "bathroom1": images.bath,
        // "24 hrs power1": images.light,
        // "bedroom1": images.bed,
    }

    const importantDetails = {
        "Property Address": hostelDetails?.address,
        "Number of Rooms": 10,
        "Electricity": "24 hours",
        "Property ID": hostelDetails?.id,
        "Kitchen": "1 Kitchen",
        "Toilet": "1 Toilet",
        "Landlord resides": "Yes",
        "Roomates": "Not allowed"
    }

    const onSwipeLeft = () => {
        if (idx <= 0) {
            return
        } else {
            setIdx(idx - 1)
            return
        }
    }

    const onSwipeRight = () => {
        if (imgLen ? idx >= (imgLen - 1) : null) {
            return
        } else {
            setIdx(idx + 1)
            return
        }
    }

    useEffect(() => {
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
                    renderLeftActions={() => <View style={{ width: 1 }} />}
                    renderRightActions={() => <View style={{ width: 1 }} />}>
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
                            <TouchableOpacity>
                                <Image source={images.archiveAdd} />
                            </TouchableOpacity>
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

                <View style={idStyles.outerAmenitiesV}>
                    <View style={idStyles.innerAmenitiesV}>
                        {
                            Object.entries(amenities).map((item, idx) =>
                                <View style={idStyles.amenitiesV} key={idx}>
                                    <Image source={item[1]} />
                                    <Text style={idStyles.amenitiesTxt}>{item[0]}</Text>
                                </View>
                            )
                        }
                    </View>
                </View>

                <ScrollView style={idStyles.outerScrollV} showsVerticalScrollIndicator={false}>
                    <View style={idStyles.scrollV}>
                        {
                            Object.entries(importantDetails).map(([key, value], idx) => <View key={idx} style={idStyles.detTxtV}>
                                <Text style={idStyles.detHeaderTxt}>{value}</Text>
                                <Text style={idStyles.detLabelTxt}>{key}</Text>
                            </View>)
                        }
                    </View>
                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    )

}
