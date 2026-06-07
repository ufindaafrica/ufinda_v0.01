import Announcement from "@/components/announcement";
import LineBreak from "@/components/lineBreak";
import Plus from "@/components/plus";
import VendorAppHeader from "@/components/vendorAppHeader";
import { images } from "@/constants/images";
import { lastMessageSentTime } from "@/deps/chatTime";
import { registerForPushNotifications } from "@/deps/registerForPushNotifications";
import { getAgentData } from "@/services/agentInfo";
import { getVendorInfo } from "@/services/getStudentInfo";
import { dashboardStyles } from "@/styles/dashboard";
import { globals, roboto } from "@/styles/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { getItemAsync } from "expo-secure-store";
import { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Dashboard() {

    const [vendor, setVendor] = useState<any>()
    const [vendorHostels, setVendorHostels] = useState<any>()

    useEffect(() => {
        registerForPushNotifications()
    }, [])

    useEffect(() => {
        const loadVendor = async () => {
            // get vendor's hostel listings
            let listings: Array<any>

            const existing_listings_raw = await AsyncStorage.getItem('LISTINGS') ?? "[]"
            const existing_listings = JSON.parse(existing_listings_raw)
            setVendorHostels(existing_listings)

            try {
                listings = await getAgentData()
                if (listings[0] == "200") {
                    await AsyncStorage.setItem('LISTINGS', JSON.stringify(listings?.[1]))
                    setVendorHostels(listings?.[1])
                }

                // WEB SOCKET HERE


            } catch {
                return
            }

            // now get vendor"s info
            let vendor: any

            const vendor_raw = await AsyncStorage.getItem('VENDOR_INFO') ?? '{}'
            vendor = JSON.parse(vendor_raw)
            console.log(vendor)

            if (Object.keys(vendor).length === 0) {
                console.log("refetching vendor")

                vendor = await getVendorInfo()
                console.log(vendor)

                if (vendor[0] != "200") {
                    return
                } else {
                    setVendor(vendor?.[1])
                    AsyncStorage.setItem('VENDOR_INFO', JSON.stringify(vendor?.[1]))
                }
            } else {
                setVendor(vendor)
                console.log(vendor)
            }
        }

        loadVendor()
    }, [])

    const allAds = () => {
        return <View style={{ justifyContent: "space-between" }}>
            <Text style={[roboto.bodySmallBold]}>All Ads</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
                <Text style={[roboto.headlineLargeBold, { paddingRight: 8 }]}>{vendorHostels?.length ?? 0}</Text>
                <Text style={[{ color: "#546881", paddingBottom: 3 }, roboto.bodySmall]}>Published</Text>
            </View>
        </View>
    }

    // const appointments = () => {
    //     return (
    //         <View>
    //             <Text style={[roboto.titleSmall, { color: "#fcfcfc", width: 255, paddingBottom: 16 }]}>You have an appointment tomorrow</Text>
    //             <Text style={[roboto.bodyMedium, { color: "#e5e5ea" }]}>Set reminder</Text>
    //         </View>
    //     )
    // }

    const metrics = [
        ["Published Ads", images.published, vendorHostels?.length ?? 0],
        ["Sold Ads", images.sold, 0],
        ["Profile View", images.vendorUser, 0],
        ["Appointments", images.appointments, 0]
    ]

    return (
        <SafeAreaView style={[globals.vendorContainer]}>
            <Plus />

            <VendorAppHeader firstName={vendor?.first_name} profileImg={vendor?.kyc_data?.profile_img?.url} />

            <ScrollView contentContainerStyle={dashboardStyles.scrollV} showsVerticalScrollIndicator={false}>
                <LineBreak />

                {/* <View style={[dashboardStyles.padding]}>
                    <Announcement view={appointments()} active />
                </View> */}

                <View style={[dashboardStyles.padding, { paddingTop: 0 }]}>
                    <Text style={[roboto.titleSmallBold, { paddingVertical: 16 }]}>My Ads</Text>

                    <View style={dashboardStyles.listingsV}>

                        {
                            vendorHostels?.map((item: any, idx: number) => {

                                const remaining = Math.floor((((item?.total_hostel_rooms ?? 0) - (item?.available_rooms ?? 0)) / (item.total_hostel_rooms ?? 0)) * 143)

                                return (<TouchableOpacity key={idx} style={[dashboardStyles.eachListing]}>
                                    <View>
                                        <Text style={[roboto.bodyMediumBold]}>{item?.title ?? ""}</Text>
                                        <Text style={[roboto.caption, dashboardStyles.postedT]}>{`posted: ${lastMessageSentTime(item?.created_at)}`}</Text>
                                    </View>

                                    <View>
                                        <View style={dashboardStyles.remEntireV}>
                                            <Text style={[roboto.headlineLargeBold]}>{`${(item?.total_hostel_rooms ?? 0) - (item?.available_rooms ?? 0)} `}</Text>
                                            <Text style={[roboto.bodyMedium, dashboardStyles.remT]}>{`/ ${item?.total_hostel_rooms ?? 0} Rooms Left`}</Text>
                                        </View>

                                        <View style={dashboardStyles.outerRemV}>
                                            <View style={[{ width: remaining }, dashboardStyles.innerRemV]}></View>
                                        </View>
                                    </View>

                                </TouchableOpacity>)
                            }
                            )
                        }

                    </View>
                </View>

                <View style={[dashboardStyles.padding, { paddingTop: 0 }]}>
                    <Announcement view={allAds()} fun={() => router.push("/(vendor)/ads")} />
                </View>

                <LineBreak />

                <View style={[dashboardStyles.padding, { paddingBottom: 0 }]}>
                    <Text style={roboto.titleSmallBold}>Metrics</Text>
                </View>

                <View style={[dashboardStyles.listingsV, { padding: 16 }]}>
                    {
                        metrics.map((item, idx) => <View key={idx} style={dashboardStyles.eachListing}>
                            <Text style={[roboto.bodyMediumBold, { color: "#546881" }]}>{item[0]}</Text>
                            <Image source={item[1]} style={dashboardStyles.metricImg} />
                            <Text style={[roboto.headingLargeBold, dashboardStyles.metricT]}>{item[2]}</Text>
                        </View>)
                    }
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

