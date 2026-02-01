import { Image, Text, TouchableOpacity, View } from "react-native";
import Thumbnail from "./thumbnail";
import { images } from "@/constants/images";
import { hostelCardStyles } from "@/styles/hostelCard"
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { roboto } from "@/styles/globals";
import { createNewChat } from "@/services/newChat";
import { EnrichedHostel, LocationObj } from "@/types";
import { handleNewChat } from "@/deps/handleNewChat";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { removeSavedHostel, saveHostel } from "@/services/saveHostel";
import { toast } from "@/deps/toast";
import { getDistance } from "geolib";
import { cdnImage } from "@/deps/getOptimizedImages";
import { Image as ExpoImage } from "expo-image"

type HostelCardProps = {
    hostel: EnrichedHostel,
    isSaved: boolean,
    reload?: () => void,
    coords?: LocationObj
}

export default function HostelCard({ hostel, isSaved, reload, coords }: HostelCardProps) {

    const onSave = async (id: string, saved: boolean) => {

        let savedHostels: Array<string> = JSON.parse(await AsyncStorage.getItem("SAVED") || "[]")

        if (!saved) {
            const saveH = await saveHostel(id)
            if (saveH[0] != "200") {
                toast("error saving hostel. try again.")
                return
            }
            savedHostels.includes(id) ? null : savedHostels.push(id)
            setSaved(true)
        } else {
            const deletH = await removeSavedHostel(id)
            if (deletH[0] != "200") {
                toast("error removing saved hostel. try again.")
                return
            }
            savedHostels = savedHostels.filter(item => item !== id)
            setSaved(false)
        }

        await AsyncStorage.setItem("SAVED", JSON.stringify(savedHostels))

        reload?.()
    }

    const [saved, setSaved] = useState(isSaved)

    useEffect(() => {
        if (saved) setArchiveImg(images.savedIcon)
        else setArchiveImg(images.archiveAdd)
    }, [saved])

    useEffect(() => {
        setSaved(isSaved)
    }, [isSaved])

    const amenities: Array<string> = []
    const stars = hostel.vendor_info?.vendor_metrics?.total_rating || 0
    const unstars = stars > 5 ? 5 : 5 - stars

    const [archiveImg, setArchiveImg] = useState(saved ? images.savedIcon : images.archiveAdd)

    // console.log(hostel.hostel_images)

    return (
        <View style={hostelCardStyles.card}>

            <TouchableOpacity style={hostelCardStyles.thumbnailV} onPress={() => hostel?.id && router.push({ pathname: "/hostel/[id]", params: { id: String(hostel.id), hostel: JSON.stringify(hostel) } })}>
                <Thumbnail bg={{uri: cdnImage(hostel.hostel_images?.[0]?.url ?? "", 400) ?? ""}} available={hostel.total_hostel_rooms > 0 ? true : false} distance={coords ? Math.floor(getDistance(coords, hostel?.geolocation ?? coords) / 1609.344) : 0} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => hostel?.id && router.push({ pathname: "/hostel/[id]", params: { id: String(hostel.id), hostel: JSON.stringify(hostel) } })} style={hostelCardStyles.mainPlusAmenities}>

                <View style={hostelCardStyles.main}>
                    <View>
                        <Text style={[hostelCardStyles.hostelName, roboto.titleSmallBold]}>{hostel.title}</Text>
                        <Text style={[hostelCardStyles.address, hostelCardStyles.textMargin, roboto.bodySmall]}>{hostel.location}</Text>
                        <Text style={[hostelCardStyles.hostelName, roboto.titleMediumBold]}>₦ {hostel.rent_per_year} / year</Text>
                        <Text style={[hostelCardStyles.address, roboto.bodySmallBold]}>PID: {hostel.id}</Text>
                    </View>
                    <TouchableOpacity onPress={() => { onSave(hostel.id, saved) }}>
                        <Image source={archiveImg} style={hostelCardStyles.archiveImg} />
                    </TouchableOpacity>
                </View>

                <View style={[hostelCardStyles.amenitiesV]}>
                    {
                        amenities.map((item, idx) => {
                            const len = amenities.length - 1
                            return (
                                <View key={item} style={hostelCardStyles.amenitiesV}>
                                    {
                                        idx > 0 ? <Text> </Text> : null
                                    }
                                    <Text style={[hostelCardStyles.address, hostelCardStyles.amenitiesT]}>{item} </Text>
                                    {idx < len ? <Image source={images.blackDot} style={hostelCardStyles.blackDot} /> : null}
                                </View>
                            )
                        })
                    }
                </View>

            </TouchableOpacity>

            <View style={hostelCardStyles.agentInfo}>
                <TouchableOpacity onPress={() => router.push({
                    pathname: '/pages/profileDetails',
                    params: {
                        vendorId: hostel?.vendor_id
                    }
                })} style={hostelCardStyles.agentCard}>
                    <ExpoImage source={hostel.vendor_info?.vendor_kyc?.profile_img?.url ? {uri: hostel.vendor_info?.vendor_kyc?.profile_img?.url} : images.user0} style={hostelCardStyles.agentPic} cachePolicy={"disk"} />
                    <View>
                        <Text style={[roboto.bodyMediumBold, hostelCardStyles.agentMargin]}>{`${hostel.vendor_info?.username}`}</Text>
                        <View style={[hostelCardStyles.stars, hostelCardStyles.agentMargin]}>
                            {
                                [...Array(stars).fill("star"), ...Array(unstars).fill("unstar")].map((type, idx) => (
                                    <Image
                                        key={`${type}-${idx}`}
                                        source={type === "star" ? images.star : images.greyStar} style={hostelCardStyles.eachStar} />
                                ))
                            }
                        </View>
                        <View style={hostelCardStyles.verifiedAgent}>
                            <Image source={images.profileTick} style={hostelCardStyles.verifiedAgentImg} />
                            <Text style={[hostelCardStyles.verifiedAgentT, roboto.caption]}>Verified Agent</Text>
                        </View>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleNewChat(hostel?.vendor_id)} style={hostelCardStyles.phoneView}>
                    <Image source={images.chat1} style={hostelCardStyles.phoneImg} />
                </TouchableOpacity>
            </View>
        </View>
    )
}
