import Announcement from "@/components/announcement";
import LineBreak from "@/components/lineBreak";
import Plus from "@/components/plus";
import VendorAppHeader from "@/components/vendorAppHeader";
import { AgentHostels } from "@/constants/dummy_data";
import { images } from "@/constants/images";
import { dashboardStyles } from "@/styles/dashboard";
import { colors, globals, roboto } from "@/styles/globals";
import { router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function Dashboard() {

    const allAds = () => {
        return <View style={{ justifyContent: "space-between" }}>
            <Text style={[roboto.bodySmallBold]}>All Ads</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
                <Text style={[roboto.headlineLargeBold, { paddingRight: 8 }]}>12</Text>
                <Text style={[{ color: "#546881", paddingBottom: 3 }, roboto.bodySmall]}>Published</Text>
            </View>
        </View>
    }

    const appointments = () => {
        return (
            <View>
                <Text style={[roboto.titleSmall, { color: "#fcfcfc", width: 255, paddingBottom: 16 }]}>You have an appointment tomorrow</Text>
                <Text style={[roboto.bodyMedium, { color: "#e5e5ea" }]}>Set reminder</Text>
            </View>
        )
    }

    const metrics = [
        ["Published Ads", images.published, 4],
        ["Sold Ads", images.sold, 2],
        ["Profile View", images.vendorUser, 14],
        ["Appointments", images.appointments, 6]
    ]

    return (
        <SafeAreaView style={[globals.vendorContainer]}>
            <Plus />

            <VendorAppHeader />

            <ScrollView contentContainerStyle={dashboardStyles.scrollV} showsVerticalScrollIndicator={false}>
                <LineBreak />

                <View style={[dashboardStyles.padding]}>
                    <Announcement view={appointments()} active />
                </View>

                <View style={[dashboardStyles.padding, { paddingTop: 0 }]}>
                    <Text style={[roboto.titleSmallBold, { paddingBottom: 8 }]}>My Ads</Text>

                    <View style={dashboardStyles.listingsV}>

                        {
                            AgentHostels.slice(0, 4).map((item, idx) => {

                                const remaining = Math.floor(((item.totalrooms - item.rentedrooms) / item.totalrooms) * 143)

                                return (<View key={idx} style={[dashboardStyles.eachListing]}>
                                    <View>
                                        <Text style={[roboto.bodyMediumBold]}>{item.name}</Text>
                                        <Text style={[roboto.caption, dashboardStyles.postedT]}>{`posted: ${item.posted} ${item.time}`}</Text>
                                    </View>

                                    <View>
                                        <View style={dashboardStyles.remEntireV}>
                                            <Text style={[roboto.headlineLargeBold]}>{`${item.totalrooms - item.rentedrooms} `}</Text>
                                            <Text style={[roboto.bodyMedium, dashboardStyles.remT]}>{`/ ${item.totalrooms} Rooms Left`}</Text>
                                        </View>

                                        <View style={dashboardStyles.outerRemV}>
                                            <View style={[{ width: remaining }, dashboardStyles.innerRemV]}></View>
                                        </View>
                                    </View>

                                </View>)
                            }
                            )
                        }

                    </View>
                </View>

                <View style={[dashboardStyles.padding, { paddingTop: 0 }]}>
                    <Announcement view={allAds()} fun={() => router.push("/(vendor)/ads")} />
                </View>

                <LineBreak />

                <View style={[dashboardStyles.padding, {paddingBottom: 0}]}>
                    <Text style={roboto.titleSmallBold}>Metrics</Text>
                </View>

                <View style={[dashboardStyles.listingsV, {padding: 16}]}>
                    {
                        metrics.map((item, idx) => <View key={idx} style={dashboardStyles.eachListing}>
                            <Text style={[roboto.bodyMediumBold, { color: "#546881"}]}>{item[0]}</Text>
                            <Image source={item[1]} style={dashboardStyles.metricImg} />
                            <Text style={[roboto.headingLargeBold, dashboardStyles.metricT]}>{item[2]}</Text>
                        </View>)
                    }
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

