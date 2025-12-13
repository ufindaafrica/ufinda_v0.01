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
import { roboto } from "@/styles/globals";
import { hostelCardStyles } from "@/styles/hostelCard";
import { thumbnailStyles } from "@/styles/componentStyles/thumbnail";
import HostelCard from "@/components/hostelCard";
// import { ScrollView } from "react-native-gesture-handler";


export default function HostelDetails() {

    const { id } = useLocalSearchParams()

    const hostelDetails: DummyHostelsType | undefined = dummyHostels.find(hostel => hostel.id === id)

    const relatedHostels: DummyHostelsType[] = dummyHostels.slice(-3)

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

    const stars = hostelDetails?.agent?.rating || 0
    const unstars = 5 - stars

    const facilities = ["Balcony", "Chandelier", "Pop Ceiling", "Tiled floor", "Wardrobe", "Running Water"]

    return (
        <SafeAreaProvider>
            <SafeAreaView style={idStyles.safeV}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={idStyles.scrollV}>

                    <View style={idStyles.headerV}>
                        <View style={idStyles.firstHeaderV}>
                            <BackArrow backFun={() => router.back()} large />
                            <Text style={roboto.titleLargeBold}>{hostelDetails?.name}</Text>
                        </View>
                        <Image source={images.more} style={idStyles.moreImg} />
                    </View>

                    <View style={idStyles.swipeV}>
                        <View style={idStyles.picV}>
                            <Image source={currentImage} style={idStyles.hostelImg} />
                            <View style={idStyles.galleryV}>
                                <Text style={[idStyles.galleryTxt, roboto.caption]}>{idx + 1}/{hostelDetails?.images.length}</Text>
                                <Image source={images.gallery} style={idStyles.galleryImg} />
                            </View>
                            <TouchableOpacity onPress={() => onSwipeLeft()} disabled={idx <= 0} style={[idStyles.navArrow, idStyles.arrowLeftMargin, idx <= 0 && idStyles.disabledArrow]}>
                                <Image source={images.galleryLeft} style={[idStyles.navImg]} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => onSwipeRight()} disabled={imgLen ? idx >= (imgLen - 1) : false} style={[idStyles.navArrow, idStyles.arrowRightMargin, (imgLen ? idx >= (imgLen - 1) : false) && idStyles.disabledArrow]}>
                                <Image source={images.galleryRight} style={[idStyles.navImg]} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={idStyles.prelimV}>
                        <View style={idStyles.topPrelimV}>
                            <View style={idStyles.firstTopPrelimV}>
                                <Text style={[idStyles.regTxt, roboto.bodyLarge]}>Room Self Contained</Text>
                                <TouchableOpacity>
                                    <Image source={images.archiveAdd} style={idStyles.archiveImg} />
                                </TouchableOpacity>
                            </View>
                            <View style={idStyles.firstTopPrelimV}>
                                <Text style={[idStyles.regTxt, roboto.titleMediumBold]}>₦ {hostelDetails?.price} / year</Text>
                                <Text style={[roboto.bodyLarge, idStyles.redTxt]}>4 rooms left</Text>
                            </View>
                            <View style={[idStyles.firstTopPrelimV]}>
                                <TouchableOpacity style={idStyles.thirdTopPrelimVOne}>
                                    <Select text="Call" icon={images.call} selected />
                                </TouchableOpacity>
                                <TouchableOpacity style={idStyles.thirdTopPrelimVTwo}>
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
                                        <Image source={item[1]} style={idStyles.archiveImg} />
                                        <Text style={roboto.caption}>{item[0]}</Text>
                                    </View>
                                )
                            }
                        </View>
                    </View>

                    <View style={idStyles.outerDetailsV}>
                        <View style={idStyles.detailsV}>
                            {
                                Object.entries(importantDetails).map(([key, value], idx) => <View key={idx} style={idStyles.detTxtV}>
                                    <Text style={[idStyles.detHeaderTxt, roboto.bodyLarge]}>{value}</Text>
                                    <Text style={[idStyles.detLabelTxt, roboto.bodySmall]}>{key}</Text>
                                </View>)
                            }
                        </View>
                    </View>

                    <View style={idStyles.outerAgentV}>
                        <View style={[hostelCardStyles.agentInfo, idStyles.innerAgentV]}>
                            <TouchableOpacity onPress={() => router.push("/pages/profileDetails")} style={hostelCardStyles.agentCard}>
                                <Image source={hostelDetails?.agent?.pic} style={hostelCardStyles.agentPic} />
                                <View>
                                    <Text style={[roboto.bodyMediumBold, hostelCardStyles.agentMargin]}>{hostelDetails?.agent?.name}</Text>
                                    <View style={[hostelCardStyles.stars, hostelCardStyles.agentMargin]}>
                                        {
                                            [...Array(stars).fill("star"), ...Array(unstars).fill("unstar")].map((type, idx) => (
                                                <Image
                                                    key={`${type}-${idx}`}
                                                    source={type === "star" ? images.star : images.greyStar} style={hostelCardStyles.eachStar} />
                                            ))
                                        }
                                    </View>
                                    {hostelDetails?.agent?.verified ? <View style={hostelCardStyles.verifiedAgent}>
                                        <Image source={images.profileTick} style={hostelCardStyles.verifiedAgentImg} />
                                        <Text style={[hostelCardStyles.verifiedAgentT, roboto.caption]}>Verified Agent</Text>
                                    </View> : null}
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={hostelCardStyles.phoneView}>
                                <Image source={images.call} style={hostelCardStyles.phoneImg} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={idStyles.outerAgentV}>
                        <View style={[idStyles.innerAgentV, idStyles.innerFacilitiesV]}>
                            <Text style={roboto.bodyLarge}>Facilities</Text>
                            <View style={idStyles.facilitiesListV}>
                                {
                                    facilities.map((item, idx) => <Text key={idx} style={[thumbnailStyles.txt, roboto.bodyLarge]}>{item}</Text>)
                                }
                            </View>
                        </View>
                    </View>

                    <View style={idStyles.outerAgentV}>
                        <Text style={roboto.bodyLargeBold}>More like this</Text>
                    </View>

                    <View style={idStyles.outerAgentV}>
                        {
                            relatedHostels?.map((item, idx) =>
                                <View key={idx} style={idStyles.cardMargin}>
                                    <HostelCard key={idx}
                                        hostel={item}
                                        isSaved={false} />
                                </View>)
                        }
                    </View>
                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    )

}
