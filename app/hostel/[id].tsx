import BackArrow from "@/components/back";
import Select from "@/components/select";
import { images } from "@/constants/images";
import { idStyles } from "@/styles/id";
import { router, useLocalSearchParams } from "expo-router";
import { Image, Text, TouchableOpacity, View, ScrollView, Linking } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { roboto } from "@/styles/globals";
import { hostelCardStyles } from "@/styles/hostelCard";
import { thumbnailStyles } from "@/styles/componentStyles/thumbnail";
import HostelCard from "@/components/hostelCard";
import { EnrichedHostel } from "@/types";
import { getHostelDetails } from "@/services/hostelDetails";
import { scale } from "@/deps/scale";
import { Image as ExpoImage } from "expo-image"
import Media from "@/components/media";
import { removeSavedHostel, saveHostel } from "@/services/saveHostel";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { handleNewChat } from "@/deps/handleNewChat";
import { getRelatedHostels } from "@/services/relatedHostels";
import { toast } from "@/deps/toast";
import { getItemAsync } from "expo-secure-store";
import { getAgentData, getAgentInfo } from "@/services/agentInfo";


export default function HostelDetails() {

    const { id, hostel } = useLocalSearchParams()
    const idString = Array.isArray(id) ? id[0] : id
    const hostelDets = Array.isArray(hostel) ? hostel[0] : hostel

    const [hostelDetails, setHostelDetails] = useState<EnrichedHostel | null>()
    const [myId, setMyId] = useState("")

    useEffect(() => {
        const setId = async () => {
            const idString = await getItemAsync('ID') ?? ''
            setMyId(idString)
        }

        setId()
    }, [])

    useEffect(() => {
        if (myId) {
            const getDetails = async () => {
                setHostelDetails(await JSON.parse(hostelDets))
            }

            const getRHostels = async () => {
                const related = await getRelatedHostels(idString)
                if (related[0] === "200") {
                    setRelatedHostels(related[1])
                }
            }

            const getVHostels = async () => {
                const vHostels = await getAgentData()
                if (vHostels[0] != "200") return
                else setHostelDetails(vHostels?.[1]?.find((item: any) => item?.id === idString))
            }

            myId.startsWith("usr") && getDetails()
            myId.startsWith("usr") && getRHostels()
            myId.startsWith("vnd") && getVHostels()
        }

    }, [myId])

    const [relatedHostels, setRelatedHostels] = useState<Array<EnrichedHostel>>([])

    const [hostelImages, setHostelImages] = useState<Array<any>>([])
    const [imgLen, setImgLen] = useState<number>(hostelImages.length)

    useEffect(() => {
        if (hostelDetails && Object.keys(hostelDetails).length > 0) {
            const imgs = hostelDetails?.hostel_images?.map(item => item.url) ?? []

            hostelDetails?.hostel_videos && imgs.push(hostelDetails?.hostel_videos?.[0]?.url)

            setHostelImages(imgs)
            setImgLen(imgs?.length)
        }
    }, [hostelDetails])

    const [currentImage, setCurrentImg] = useState(hostelImages?.[0])
    const [idx, setIdx] = useState(0)

    const amenities = {
        [hostelDetails?.room_type ?? ""]: images.duplex,
        [hostelDetails?.toilet_access ?? ""]: images.bath,
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
        "Landlord resides": hostelDetails?.landlord_resides ?? "",
        "Roommates allowed": hostelDetails?.roommates_allowed ?? ""
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
        setCurrentImg(hostelImages?.[0])
    }, [imgLen])

    useEffect(() => {
        setCurrentImg(hostelImages?.[idx])
    }, [idx])

    const stars = hostelDetails?.vendor_info?.vendor_metrics?.total_rating ?? 0
    const unstars = stars > 5 ? 0 : 5 - stars

    const facilities = ["Balcony", "Chandelier", "Pop Ceiling", "Tiled floor", "Wardrobe", "Running Water"]

    const [mediaOpen, setMediaOpen] = useState(false)
    const [mediaLoading, setMediaLoading] = useState(false)

    const [saved, setSaved] = useState<boolean>(false)

    const saveLocal = async (id: string) => {
        try {
            const savedIds: Array<string> = JSON.parse(await AsyncStorage.getItem("SAVED") ?? "[]")

            let newIds: Array<string> = (savedIds.includes(id)) ? [...savedIds.filter(item => item != id)] : [...savedIds, id]

            await AsyncStorage.setItem('SAVED', JSON.stringify(newIds))
            setSaved(newIds.includes(id))
        }
        catch (err) {
            console.error(err)
        }
    }

    const handleSaveHostel = async () => {
        if (!saved) {
            const save = await saveHostel(idString)
            if (save[0] == "200") {
                await saveLocal(idString)
                setSaved(true)
                return
            } else {
                toast("error saving hostel. try again.")
                return
            }
        } else {
            const unsave = await removeSavedHostel(idString)
            if (unsave[0] == "200") {
                await saveLocal(idString)
                setSaved(false)
                return
            } else {
                toast("error unsaving hostel. try again.")
                return
            }
        }

    }

    useEffect(() => {
        const isSaved = async (id: string) => {
            const savedIds: Array<string> = JSON.parse(await AsyncStorage.getItem('SAVED') ?? "[]")
            if (savedIds.includes(id)) setSaved(true)
            else setSaved(false)
        }

        isSaved(idString)

    }, [])

    const [call, setCall] = useState("Call")
    const placeCall = () => {
        if (call === "Call") setCall(hostelDetails?.vendor_info?.phone ?? "")
        else Linking.openURL(`tel:${call}`)
    }

    const isVideo = (img: string) => /\.(mp4|webm|mov|mkv)(\?|$)/i.test(img)

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
                            <TouchableOpacity onPress={() => setMediaOpen(true)}>
                                <ExpoImage key={currentImage} source={currentImage} style={idStyles.hostelImg} contentFit="cover" transition={0} cachePolicy="disk" />
                            </TouchableOpacity>
                            <View style={idStyles.galleryV}>
                                <Text style={[idStyles.galleryTxt, roboto.caption]}>{idx + 1}/{imgLen}</Text>
                                <Image source={images.gallery} style={idStyles.galleryImg} />
                            </View>
                            <TouchableOpacity onPress={() => onSwipeLeft()} disabled={idx <= 0} style={[idStyles.navArrow, idStyles.arrowLeftMargin, idx <= 0 && idStyles.disabledArrow]}>
                                <Image source={images.galleryLeft} style={[idStyles.navImg]} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => onSwipeRight()} disabled={imgLen ? idx >= (imgLen - 1) : false} style={[idStyles.navArrow, idStyles.arrowRightMargin, (imgLen ? idx >= (imgLen - 1) : false) && idStyles.disabledArrow]}>
                                <Image source={images.galleryRight} style={[idStyles.navImg]} />
                            </TouchableOpacity>
                            {currentImage?.toString().endsWith("mp4") && <TouchableOpacity onPress={() => { setMediaOpen(true) }} style={{ position: 'absolute', alignSelf: 'center' }}>
                                <Image source={images.play} style={{ width: scale(56), height: scale(56), alignSelf: 'center' }} /></TouchableOpacity>}
                        </View>
                    </View>

                    <View style={[idStyles.prelimV, myId?.startsWith("vnd") && idStyles.shortprelimV]}>
                        <View style={idStyles.topPrelimV}>
                            <View style={idStyles.firstTopPrelimV}>
                                <Text style={[idStyles.regTxt, roboto.bodyLarge]}>{hostelDetails?.room_type}</Text>
                                {
                                    myId?.startsWith("usr") && <TouchableOpacity onPress={() => handleSaveHostel()}>
                                        <Image source={saved ? images.savedIcon : images.archiveAdd} style={idStyles.archiveImg} />
                                    </TouchableOpacity>
                                }
                            </View>
                            <View style={idStyles.firstTopPrelimV}>
                                <Text style={[idStyles.regTxt, roboto.titleMediumBold]}>₦ {hostelDetails?.rent_per_year} / year</Text>
                                <Text style={[roboto.bodyLarge, idStyles.redTxt]}>{`${hostelDetails?.total_hostel_rooms ?? ""} rooms left`}</Text>
                            </View>
                            {
                                myId?.startsWith("usr") && <View style={[idStyles.firstTopPrelimV]}>
                                    <TouchableOpacity style={idStyles.thirdTopPrelimVOne}>
                                        <Select text={call} icon={images.call} selected selectFun={placeCall} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={idStyles.thirdTopPrelimVTwo}>
                                        <Select text="Book on uFinda" selected={false} selectFun={() => {
                                            if (hostelDetails?.vendor_id) { handleNewChat(hostelDetails?.vendor_id, hostelDetails?.title) }
                                        }} />
                                    </TouchableOpacity>
                                </View>
                            }
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

                    {myId?.startsWith("usr") && <View style={idStyles.outerAgentV}>
                        <View style={[hostelCardStyles.agentInfo, idStyles.innerAgentV]}>
                            <TouchableOpacity onPress={() => router.push({
                                pathname: '/pages/profileDetails',
                                params: {
                                    vendorId: hostelDetails?.vendor_id
                                }
                            })} style={hostelCardStyles.agentCard}>
                                <Image source={hostelDetails?.vendor_info?.vendor_kyc?.profile_img?.url ? { uri: hostelDetails.vendor_info?.vendor_kyc?.profile_img?.url } : images.user0} style={hostelCardStyles.agentPic} />
                                <View>
                                    <Text style={[roboto.bodyMediumBold, hostelCardStyles.agentMargin]}>{`${hostelDetails?.vendor_info?.username ?? ""}`}</Text>
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
                            <TouchableOpacity onPress={() => Linking.openURL(`tel:${hostelDetails?.vendor_info?.phone}`)} style={hostelCardStyles.phoneView}>
                                <Image source={images.call} style={hostelCardStyles.phoneImg} />
                            </TouchableOpacity>
                        </View>
                    </View>}

                    {/* {myId?.startsWith("usr") && <View style={idStyles.outerAgentV}>
                        <View style={[idStyles.innerAgentV, idStyles.innerFacilitiesV]}>
                            <Text style={roboto.bodyLarge}>Facilities</Text>
                            <View style={idStyles.facilitiesListV}>
                                {
                                    facilities.map((item, idx) => <Text key={idx} style={[thumbnailStyles.txt, roboto.bodyLarge]}>{item}</Text>)
                                }
                            </View>
                        </View>
                    </View>} */}

                    {myId?.startsWith('usr') && <View style={idStyles.outerAgentV}>
                        <Text style={roboto.bodyLargeBold}>More like this</Text>
                    </View>}

                    {myId?.startsWith('usr') && <View style={idStyles.outerAgentV}>
                        {
                            relatedHostels?.map((item, idx) =>
                                <View key={idx} style={idStyles.cardMargin}>
                                    <HostelCard key={idx}
                                        hostel={item}
                                        isSaved={false} />
                                </View>)
                        }
                    </View>}


                </ScrollView>
                {
                    mediaOpen && <Media media={currentImage} left={onSwipeLeft} right={onSwipeRight} idx={idx} imgLen={imgLen} video={isVideo(currentImage ?? "")} close={() => { setMediaOpen(false) }} />
                }
            </SafeAreaView>
        </SafeAreaProvider>
    )

}
