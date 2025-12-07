import CircleProgress from "@/components/circleProgress";
import Plus from "@/components/plus";
import Search from "@/components/search";
import { AgentHostels } from "@/constants/dummy_data";
import { images } from "@/constants/images";
import { adsStyles } from "@/styles/componentStyles/ads";
import { colors, globals, roboto } from "@/styles/globals";
import { homeStyles } from "@/styles/home";
import { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Ads() {

    const [current, setCurrent] = useState("all")

    return (
        <SafeAreaView style={[globals.container, globals.homeContainer, adsStyles.background]}>
            <Plus />

            <TouchableOpacity style={[adsStyles.headerV, adsStyles.layoutMarginSmall]}>
                <Text style={[roboto.titleLargeBold, adsStyles.blackText]}>My Ads</Text>
                <View style={adsStyles.bellV}>
                    <Image source={images.bell} style={adsStyles.bellImg} />
                </View>
            </TouchableOpacity>

            <View style={homeStyles.layoutMargin}>
                <Search />
            </View>

            <View style={[adsStyles.headerV, homeStyles.layoutMargin]}>
                <TouchableOpacity onPress={() => setCurrent("all")}>
                    <Text style={[roboto.titleSmall, current === "all" ? adsStyles.greenText : adsStyles.greyText]}>All(6)</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setCurrent("open")}>
                    <Text style={[roboto.titleSmall, current === "open" ? adsStyles.greenText : adsStyles.greyText]}>Open(4)</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setCurrent("closed")}>
                    <Text style={[roboto.titleSmall, current === "closed" ? adsStyles.greenText : adsStyles.greyText]}>Closed(2)</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adsStyles.scrollV}>

                <TouchableOpacity>
                    <Text style={[roboto.bodyLarge, colors.foundationWarningDark, adsStyles.rightText, adsStyles.layoutMarginSmall]}>Manage Ads</Text>
                </TouchableOpacity>

                {
                    AgentHostels.map((item, idx) => <View key={idx} style={[adsStyles.headerV, adsStyles.eachAd, adsStyles.layoutMarginSmall]}>
                        <View style={adsStyles.leftV}>
                            <View>
                                <Text style={[roboto.titleSmallBold, adsStyles.blackText]}>{item.name}</Text>
                                <Text style={[roboto.caption, colors.grays]}>{`posted: ${item.posted} ${item.time}`}</Text>
                            </View>
                            <View>
                                <Text style={[roboto.bodyLarge, adsStyles.blackText]}>{item.address}</Text>
                                <View style={adsStyles.amenitiesV}>
                                    <Text style={[roboto.bodySmall, colors.darkBurntOrange]}>{item.product}</Text>
                                    <Image source={images.dot} style={adsStyles.dotImg} />
                                    <Text style={[roboto.bodySmall, colors.darkBurntOrange]}>{`${item.distance.toFixed(1)}mi`}
                                    </Text>
                                    <Image source={images.dot} style={adsStyles.dotImg} />
                                    <Text style={[roboto.bodySmall, colors.darkBurntOrange]}>{item.hostelType}</Text>
                                </View>
                            </View>
                        </View>
                        <CircleProgress progress={item.rentedrooms} totalProgress={item.totalrooms} />
                    </View>)
                }

            </ScrollView>

        </SafeAreaView>
    )
}
