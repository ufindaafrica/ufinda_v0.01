import { Image, Text, TouchableOpacity, View } from "react-native";
import Thumbnail from "./thumbnail";
import { images } from "@/constants/images";
import { hostelCardStyles } from "@/styles/hostelCard"
import { DummyHostelsType } from "@/constants/dummy_data";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { getItemAsync, setItemAsync } from "expo-secure-store";
import { roboto } from "@/styles/globals";

type HostelCardProps = {
    hostel: DummyHostelsType,
    isSaved: boolean,
    reload?: () => void
}

export default function HostelCard({ hostel, isSaved, reload }: HostelCardProps) {

    const onSave = async (id: string, saved: boolean) => {

        let savedHostels: Array<string> = JSON.parse(await getItemAsync("SAVED") || "[]")

        if (!saved) {
            savedHostels.includes(id) ? null : savedHostels.push(id)
            setSaved(true)
        } else {
            savedHostels = savedHostels.filter(item => item !== id)
            setSaved(false)
        }

        await setItemAsync("SAVED", JSON.stringify(savedHostels))

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

    const amenities = hostel.amenities || []
    const stars = hostel.agent?.rating || 0
    const unstars = 5 - stars

    const [archiveImg, setArchiveImg] = useState(saved ? images.savedIcon : images.archiveAdd)

    return (
        <View style={hostelCardStyles.card}>

            <TouchableOpacity style={hostelCardStyles.thumbnailV} onPress={() => hostel?.id && router.push({ pathname: "/hostel/[id]", params: { id: String(hostel.id) } })}>
                <Thumbnail bg={hostel.images[0]} available={hostel.available} distance={hostel.distance} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => hostel?.id && router.push({ pathname: "/hostel/[id]", params: { id: String(hostel.id) } })} style={hostelCardStyles.mainPlusAmenities}>

                <View style={hostelCardStyles.main}>
                    <View>
                        <Text style={[hostelCardStyles.hostelName, roboto.titleSmallBold]}>{hostel.name}</Text>
                        <Text style={[hostelCardStyles.address, hostelCardStyles.textMargin, roboto.bodySmall]}>{hostel.address}</Text>
                        <Text style={[hostelCardStyles.hostelName, roboto.titleMediumBold]}>₦ {hostel.price} / year</Text>
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
                <View style={hostelCardStyles.agentCard}>
                    <Image source={hostel.agent?.pic} style={hostelCardStyles.agentPic} />
                    <View>
                        <Text style={[roboto.bodyMediumBold, hostelCardStyles.agentMargin]}>{hostel.agent?.name}</Text>
                        <View style={[hostelCardStyles.stars, hostelCardStyles.agentMargin]}>
                            {
                                [...Array(stars).fill("star"), ...Array(unstars).fill("unstar")].map((type, idx) => (
                                    <Image
                                        key={`${type}-${idx}`}
                                        source={type === "star" ? images.star : images.greyStar} style={hostelCardStyles.eachStar} />
                                ))
                            }
                        </View>
                        {hostel.agent?.verified ? <View style={hostelCardStyles.verifiedAgent}>
                            <Image source={images.profileTick} style={hostelCardStyles.verifiedAgentImg} />
                            <Text style={[hostelCardStyles.verifiedAgentT, roboto.caption]}>Verified Agent</Text>
                        </View> : null}
                    </View>
                </View>
                <TouchableOpacity style={hostelCardStyles.phoneView}>
                    <Image source={images.call} style={hostelCardStyles.phoneImg} />
                </TouchableOpacity>
            </View>
        </View>
    )
}
