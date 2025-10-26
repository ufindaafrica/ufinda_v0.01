import { Image, Text, TouchableOpacity, View } from "react-native";
import Thumbnail from "./thumbnail";
import { images } from "@/constants/images";
import { hostelCardStyles } from "@/styles/hostelCard"


export default function HostelCard() {

    const amenities = ["Self contain", "Toilet", "Kitchen", "Duplex", "24 hours power"]
    const stars = 4
    const unstars = 5 - stars

    return (
        <View style={hostelCardStyles.card}>

            <View style={hostelCardStyles.thumbnailV}>
                <Thumbnail />
            </View>

            <View style={hostelCardStyles.main}>
                <View>
                    <Text style={[hostelCardStyles.hostelName]}>Bethel Lodge</Text>
                    <Text style={[hostelCardStyles.address, hostelCardStyles.textMargin]}>Old Ikoyi, Ikoyi Lagos</Text>
                    <Text style={hostelCardStyles.hostelName}>₦ 280,000 / year</Text>
                    <Text style={[hostelCardStyles.address, hostelCardStyles.textMargin]}>PID: 78MBFK</Text>
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
                                        {idx < len ? <Image source={images.blackDot} /> : null}
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
                    <Image source={images.user0} style={hostelCardStyles.agentPic} />
                    <View>
                        <Text style={[hostelCardStyles.agentName, hostelCardStyles.agentMargin]}>Adeyemi Martins</Text>
                        <View style={[hostelCardStyles.stars, hostelCardStyles.agentMargin]}>
                            {
                                [...Array(stars).fill("star"), ...Array(unstars).fill("unstar")].map((type, idx) => (
                                    <Image
                                        key={`${type}-${idx}`}
                                        source={type === "star" ? images.star : images.greyStar} />
                                ))
                            }
                        </View>
                        <View style={hostelCardStyles.verifiedAgent}>
                            <Image source={images.profileTick} />
                            <Text style={hostelCardStyles.verifiedAgentT}>Verified Agent</Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity style={hostelCardStyles.phoneView}>
                    <Image source={images.call} style={hostelCardStyles.phoneImg} />
                </TouchableOpacity>
            </View>
        </View>
    )
}
