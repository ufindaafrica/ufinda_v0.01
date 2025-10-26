import { Image, Text, TouchableOpacity, View } from "react-native";
import Thumbnail from "./thumbnail";
import { images } from "@/constants/images";
import { hostelCardStyles } from "@/styles/hostelCard"
import { DummyHostelsType } from "@/constants/dummy_data";

export default function HostelCard(hostel: DummyHostelsType) {

    const amenities = hostel.amenities || []
    const stars = hostel.agent?.rating || 0
    const unstars = 5 - stars

    return (
        <View style={hostelCardStyles.card}>

            <View style={hostelCardStyles.thumbnailV}>
                <Thumbnail bg={hostel.images[0]} available={hostel.available} distance={hostel.distance} />
            </View>

            <View style={hostelCardStyles.main}>
                <View>
                    <Text style={[hostelCardStyles.hostelName]}>{hostel.name}</Text>
                    <Text style={[hostelCardStyles.address, hostelCardStyles.textMargin]}>{hostel.address}</Text>
                    <Text style={hostelCardStyles.hostelName}>₦ {hostel.price} / year</Text>
                    <Text style={[hostelCardStyles.address, hostelCardStyles.textMargin]}>PID: {hostel.id}</Text>
                    <View style={[hostelCardStyles.amenitiesV, hostelCardStyles.textMargin]}>
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
                </View>
                <TouchableOpacity>
                    <Image source={images.archiveAdd} />
                </TouchableOpacity>
            </View>

            <View style={hostelCardStyles.agentInfo}>
                <View style={hostelCardStyles.agentCard}>
                    <Image source={hostel.agent?.pic} style={hostelCardStyles.agentPic} />
                    <View>
                        <Text style={[hostelCardStyles.agentName, hostelCardStyles.agentMargin]}>{hostel.agent?.name}</Text>
                        <View style={[hostelCardStyles.stars, hostelCardStyles.agentMargin]}>
                            {
                                [...Array(stars).fill("star"), ...Array(unstars).fill("unstar")].map((type, idx) => (
                                    <Image
                                        key={`${type}-${idx}`}
                                        source={type === "star" ? images.star : images.greyStar} />
                                ))
                            }
                        </View>
                        {hostel.agent?.verified ? <View style={hostelCardStyles.verifiedAgent}>
                            <Image source={images.profileTick} />
                            <Text style={hostelCardStyles.verifiedAgentT}>Verified Agent</Text>
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
