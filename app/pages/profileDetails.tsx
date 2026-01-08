import BackArrow from "@/components/back";
import Filter from "@/components/filter";
import HostelCard from "@/components/hostelCard";
import { images } from "@/constants/images";
import { text } from "@/constants/texts";
import { handleNewChat } from "@/deps/handleNewChat";
import { moderateScale, scale, verticalScale } from "@/deps/scale";
import { toast } from "@/deps/toast";
import { getAgentInfo } from "@/services/agentInfo";
import { colors, globals, roboto } from "@/styles/globals";
import { ProfileDetailsStyles } from "@/styles/profileDetails";
import { singleChatStyles } from "@/styles/singleChat";
import { EnrichedHostel } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function ProfileDetails() {

    const { vendorId } = useLocalSearchParams()
    const vendorIdString = Array.isArray(vendorId) ? vendorId[0] : vendorId

    const [vendorDetails, setVendorDetails] = useState<any>()

    const getVendorDetails = async () => {
        const vendor = await getAgentInfo(vendorIdString)
        if (vendor[0] != "200") {
            toast("error getting agent info. try later.")
            return
        }
        setVendorDetails(vendor?.[1]?.[0]?.vendor_info ?? {})
        setHostels(vendor?.[1] ?? [])
    }

    useEffect(() => {
        const vendorDets = async () => await getVendorDetails()

        vendorDets()
    }, [vendorIdString])

    const options = ["Categories", ...text.hosteltypes]
    const sort = ["Sort", "Price - Highest to Lowest", "Price - Lowest to Highest", "Near Me"]

    const [catVisible, setCatVisible] = useState(false)
    const [sortVisible, setSortVisible] = useState(false)

    const setCatVisibility = (visibility: boolean) => {
        setCatVisible(visibility)
        setSortVisible(false)
    }

    const setSortVisibility = (visibility: boolean) => {
        setSortVisible(visibility)
        setCatVisible(false)
    }

    const [savedIds, setSavedIds] = useState<Array<string>>([])
    const [hostels, setHostels] = useState<EnrichedHostel[] | null>()
    const [reloadHome, setReloadHome] = useState(false)

    useEffect(() => {
        const savedHostels = async () => {
            const favHostels = JSON.parse(await AsyncStorage.getItem('SAVED') || "[]")
            setSavedIds(favHostels)
        }

        savedHostels()

    }, [])

    return (
        <SafeAreaView style={[globals.container, globals.lightContainer]}>
            <View style={[singleChatStyles.row, singleChatStyles.jCenter, globals.authContainer]}>
                <BackArrow large backFun={() => router.back()} />
                <TouchableOpacity>
                    <Image source={images.more} style={singleChatStyles.img} />
                </TouchableOpacity>
            </View>

            <View style={{ alignSelf: 'center' }}>
                <View style={{ width: scale(144), height: scale(144), borderRadius: 144, borderWidth: 4, borderColor: '#8e8e93', justifyContent: 'center', alignItems: 'center' }}>
                    {
                        vendorDetails?.vendor_kyc?.profile_img?.url ? <Image source={{ uri: vendorDetails?.vendor_kyc?.profile_img?.url }} style={{width: scale(128), height: scale(128), borderRadius: 128, resizeMode: 'cover'}} /> : <View style={{ width: scale(128), height: scale(128), borderRadius: 128, backgroundColor: '#d9d9d9' }}></View>
                    }
                </View>
                <Text style={[roboto.headlineSmallBold, { alignSelf: 'center', paddingTop: moderateScale(16) }]}>{`${vendorDetails?.first_name ?? ""} ${vendorDetails?.last_name ?? ""}`}</Text>
            </View>

            <View style={[singleChatStyles.jCenter, singleChatStyles.row, globals.authContainer]}>
                <View style={[singleChatStyles.row, singleChatStyles.gap]}>
                    <Image source={images.orangeProfileTick} style={singleChatStyles.img} />
                    <Text style={[roboto.bodyLarge, colors.darkBurntOrange]}>Verified</Text>
                </View>

                <View style={[singleChatStyles.row, singleChatStyles.gap]}>
                    <Image source={images.darkOrangeStar} style={singleChatStyles.img} />
                    <Text style={[roboto.bodyLarge, colors.darkBurntOrange]}>{`${vendorDetails?.vendor_metrics?.current_rating ?? 0} / 5 (${vendorDetails?.vendor_metrics?.total_ratings ?? 0})`}</Text>
                </View>

                <View style={[singleChatStyles.row, singleChatStyles.gap]}>
                    <Image source={images.like} style={singleChatStyles.img} />
                    <Text style={[roboto.bodyLarge, colors.darkBurntOrange]}>{`${vendorDetails?.vendor_metrics?.current_rating ?? 0 / 5 * 100}%`}</Text>
                </View>
            </View>

            <View style={[globals.authContainer, singleChatStyles.row, singleChatStyles.jCenter, { paddingTop: 0 }]}>
                <TouchableOpacity onPress={() => {Linking.openURL(`tel:${vendorDetails?.phone}`)}} style={[{ width: scale(171), height: verticalScale(44), borderRadius: 8, borderWidth: 1, borderColor: '#c7c7cc', justifyContent: "center", alignItems: "center" }, singleChatStyles.row, singleChatStyles.gap]}>
                    <Image source={images.greenCall} style={singleChatStyles.smallImg} />
                    <Text style={[roboto.mediumEmphasizedBold, colors.foundationWarningDark]}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {handleNewChat(vendorIdString)}} style={[{ width: scale(171), height: verticalScale(44), borderRadius: 8, borderWidth: 1, borderColor: '#c7c7cc', justifyContent: "center", alignItems: "center" }, singleChatStyles.row, singleChatStyles.gap]}>
                    <Text style={[roboto.mediumEmphasizedBold, colors.foundationWarningDark]}>Message</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={{ backgroundColor: '#f5f5f5', flex: 1 }} contentContainerStyle={{ paddingBottom: verticalScale(50) }}>

                <ScrollView contentContainerStyle={{ paddingBottom: verticalScale(50) }} style={[{ width: scale(358), height: verticalScale(179), borderRadius: 16, borderWidth: 1, borderColor: '#e5e5ea', marginTop: moderateScale(16), alignSelf: 'center' }, globals.lightContainer, globals.authContainer]}>
                    <Text style={[roboto.titleSmallBold, { paddingBottom: 8 }]}>About Me</Text>
                    <Text style={[roboto.bodyLarge, colors.grays]}></Text>
                </ScrollView>

                <View style={[globals.authContainer, singleChatStyles.row, singleChatStyles.jCenter, { paddingBottom: 0 }]}>
                    <View style={ProfileDetailsStyles.eachFilterV}>
                        <Filter filterType="options" options={options} visible={catVisible} setVisible={setCatVisibility} setCurrentFilter={() => null} />
                    </View>
                    <View style={ProfileDetailsStyles.eachFilterV}>
                        <Filter filterType="options" options={sort} text="Sort" visible={sortVisible} setVisible={setSortVisibility} setCurrentFilter={() => null} />
                    </View>
                </View>

                {
                    hostels?.slice(1, 3).map((hostel, index) =>
                        <View style={globals.authContainer} key={index}>
                            <HostelCard
                                hostel={hostel}
                                isSaved={savedIds.includes(hostel.id)}
                                reload={() => setReloadHome(!reloadHome)}
                            />
                        </View>)
                }
            </ScrollView>
        </SafeAreaView>
    )
}
