import CircleProgress from "@/components/circleProgress";
import Plus from "@/components/plus";
import Search from "@/components/search";
import { images } from "@/constants/images";
import { lastMessageSentTime } from "@/deps/chatTime";
import { getAgentData } from "@/services/agentInfo";
import { adsStyles } from "@/styles/componentStyles/ads";
import { colors, globals, roboto } from "@/styles/globals";
import { homeStyles } from "@/styles/home";
import { EnrichedHostel } from "@/types";
import { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Ads() {


    type CurrentFilter = "all" | "open" | "closed"

    const [current, setCurrent] = useState<CurrentFilter>("all")

    const [vendorHostels, setVendorHostels] = useState<Array<EnrichedHostel> | null>()
    const [allHostels, setAllHostels] = useState(0)
    const [openHostels, setOpenHostels] = useState(0)
    const [closedHostels, setClosedHostels] = useState(0)

    const [openHostelsList, setOpenHostelsList] = useState<Array<EnrichedHostel> | null>()
    const [closedHostelsList, setClosedHostelsList] = useState<Array<EnrichedHostel> | null>()

    const currentMap = {
        all: vendorHostels,
        open: openHostelsList,
        closed: closedHostelsList
    }

    const activeCurrent = currentMap[current] ?? []

    useEffect(() => {
        const loadVendor = async () => {

            const listings = await getAgentData()
            console.log(listings)
            if (listings[0] != "200") {
                // router.replace("/auth/login")
                return
            } else {
                setVendorHostels(listings?.[1])
            }
        }

        loadVendor()
    }, [])

    useEffect(() => {
        setAllHostels(vendorHostels?.length ?? 0)
        setOpenHostels((vendorHostels?.filter((item: any) => (item?.available_rooms ?? 0) > 0))?.length ?? 0)
        setClosedHostels((vendorHostels?.filter((item: any) => (item?.available_rooms ?? 0) <= 0))?.length ?? 0)

        let openHostelsL: Array<EnrichedHostel> = []
        let closedHostelsL: Array<EnrichedHostel> = []

        vendorHostels?.forEach((item: EnrichedHostel) => {
            if ((item?.available_rooms ?? 0) > 0) openHostelsL.push(item)
            else closedHostelsL.push(item)

            console.log(item?.available_rooms)
        })

        setOpenHostelsList(openHostelsL)
        setClosedHostelsList(closedHostelsL)
    }, [vendorHostels])

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
                    <Text style={[roboto.titleSmall, current === "all" ? adsStyles.greenText : adsStyles.greyText]}>{`All(${allHostels ?? 0})`}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setCurrent("open")}>
                    <Text style={[roboto.titleSmall, current === "open" ? adsStyles.greenText : adsStyles.greyText]}>{`Open(${openHostels})`}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setCurrent("closed")}>
                    <Text style={[roboto.titleSmall, current === "closed" ? adsStyles.greenText : adsStyles.greyText]}>{`Closed(${closedHostels})`}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adsStyles.scrollV}>

                <TouchableOpacity>
                    <Text style={[roboto.bodyLarge, colors.foundationWarningDark, adsStyles.rightText, adsStyles.layoutMarginSmall]}>Manage Ads</Text>
                </TouchableOpacity>

                {
                    activeCurrent.map((item:any, idx:number) => <TouchableOpacity key={idx} style={[adsStyles.headerV, adsStyles.eachAd, adsStyles.layoutMarginSmall]}>
                        <View style={adsStyles.leftV}>
                            <View>
                                <Text style={[roboto.titleSmallBold, adsStyles.blackText]}>{item?.title ?? ""}</Text>
                                <Text style={[roboto.caption, colors.grays]}>{`posted: ${lastMessageSentTime(item?.created_at) ?? ""}`}</Text>
                            </View>
                            <View>
                                <Text style={[roboto.bodyLarge, adsStyles.blackText]}>{item?.location}</Text>
                                <View style={adsStyles.amenitiesV}>
                                    <Text style={[roboto.bodySmall, colors.darkBurntOrange]}>Hostel</Text>
                                    <Image source={images.dot} style={adsStyles.dotImg} />
                                    {/* <Text style={[roboto.bodySmall, colors.darkBurntOrange]}>{`${item?.distance?.toFixed(1) ?? ""} mi`}
                                    </Text>
                                    <Image source={images.dot} style={adsStyles.dotImg} /> */}
                                    <Text style={[roboto.bodySmall, colors.darkBurntOrange]}>{item?.room_type ?? ""}</Text>
                                </View>
                            </View>
                        </View>
                        <CircleProgress progress={item?.available_rooms ?? 0} totalProgress={item?.total_hostel_rooms ?? 0} />
                    </TouchableOpacity>)
                }

            </ScrollView>

        </SafeAreaView>
    )
}
