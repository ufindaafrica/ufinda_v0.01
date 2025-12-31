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
import { EnrichedHostel } from "@/types";
import { getHostelDetails } from "@/services/hostelDetails";


export default function HostelDetails() {

    const { id } = useLocalSearchParams()
    const idString = Array.isArray(id) ? id[0] : id

    // const hostelDetails: EnrichedHostel | undefined = dummyHostels.find(hostel => hostel.id === id)

    const [hostelDetails, setHostelDetails] = useState<EnrichedHostel | null>()

    useEffect(() => {
        const getDetails = async () => {
            const details = await getHostelDetails(idString)
            if (details[0] != '200') return
            else setHostelDetails(details[1])
        }
        getDetails()
    }, [])

    const relatedHostels: EnrichedHostel[] = [].slice(-3)

    const [hostelImages, setHostelImages] = useState<Array<any>>([])
    const [imgLen, setImgLen] = useState<number>(hostelImages.length)

    useEffect(() => {
        const imgs = hostelDetails?.hostel_images?.map(item => item.url) ?? []

        hostelDetails?.hostel_videos && imgs.push(hostelDetails?.hostel_videos?.[0]?.url)

        setHostelImages(imgs)
    }, [])

    useEffect(() => {
        setImgLen(hostelImages.length)
    }, [hostelImages])

    const [currentImage, setCurrentImg] = useState(hostelImages?.[0])
    const [idx, setIdx] = useState(0)

    const amenities = {
        "duplex": images.duplex,
        "bathroom": images.bath,
        "24 hrs power": images.light,
        "bedroom": images.bed,
    }

    const importantDetails = {
        "Property Address": hostelDetails?.location ?? "",
        "Number of Available Rooms": hostelDetails?.total_hostel_rooms ?? "",
        "Electricity": "24 hours",
        "Property ID": hostelDetails?.id ?? "",
        "Kitchen": hostelDetails?.kitchen_access ?? "",
        "Toilet": hostelDetails?.toilet_access ?? "",
        "Landlord resides": hostelDetails?.landlord_resides.toUpperCase() ?? "",
        "Roomates allowed": hostelDetails?.roommates_allowed?.toUpperCase() ?? ""
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

    const stars = hostelDetails?.vendor_info?.vendor_metrics?.total_rating ?? 0
    const unstars = stars > 5 ? 0 : 5 - stars

    const facilities = ["Balcony", "Chandelier", "Pop Ceiling", "Tiled floor", "Wardrobe", "Running Water"]

    return (
        <SafeAreaProvider>
            <SafeAreaView style={idStyles.safeV}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={idStyles.scrollV}>

                    <View style={idStyles.headerV}>
                        <View style={idStyles.firstHeaderV}>
                            <BackArrow backFun={() => router.back()} large />
                            <Text style={roboto.titleLargeBold}>{hostelDetails?.title ?? ""}</Text>
                        </View>
                        <Image source={images.more} style={idStyles.moreImg} />
                    </View>

                    <View style={idStyles.swipeV}>
                        <View style={idStyles.picV}>
                            <Image source={{uri: currentImage}} style={idStyles.hostelImg} />
                            <View style={idStyles.galleryV}>
                                <Text style={[idStyles.galleryTxt, roboto.caption]}>{idx + 1}/{hostelDetails?.hostel_images.length}</Text>
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
                                <Text style={[idStyles.regTxt, roboto.titleMediumBold]}>₦ {hostelDetails?.rent_per_year} / year</Text>
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
                                <Image source={hostelDetails?.vendor_info?.vendor_kyc?.profile_img?.url ? { uri: hostelDetails.vendor_info?.vendor_kyc?.profile_img?.url } : images.user0} style={hostelCardStyles.agentPic} />
                                <View>
                                    <Text style={[roboto.bodyMediumBold, hostelCardStyles.agentMargin]}>{`${hostelDetails?.vendor_info?.first_name} ${hostelDetails?.vendor_info?.last_name}`}</Text>
                                    <View style={[hostelCardStyles.stars, hostelCardStyles.agentMargin]}>
                                        {
                                            [...Array(stars).fill("star"), ...Array(unstars).fill("unstar")].map((type, idx) => (
                                                <Image
                                                    key={`${type}-${idx}`}
                                                    source={type === "star" ? images.star : images.greyStar} style={hostelCardStyles.eachStar} />
                                            ))
                                        }
                                    </View>
                                    {true ? <View style={hostelCardStyles.verifiedAgent}>
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
