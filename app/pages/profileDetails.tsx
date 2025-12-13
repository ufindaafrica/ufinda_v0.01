import BackArrow from "@/components/back";
import Filter from "@/components/filter";
import HostelCard from "@/components/hostelCard";
import { dummyHostels, DummyHostelsType } from "@/constants/dummy_data";
import { images } from "@/constants/images";
import { text } from "@/constants/texts";
import { moderateScale, scale, verticalScale } from "@/deps/scale";
import { colors, globals, roboto } from "@/styles/globals";
import { homeStyles } from "@/styles/home";
import { ProfileDetailsStyles } from "@/styles/profileDetails";
import { singleChatStyles } from "@/styles/singleChat";
import { router, useFocusEffect } from "expo-router";
import { getItemAsync } from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaFrame } from "react-native-safe-area-context";


export default function ProfileDetails() {

    const options = ["Categories", "Self con", "Single Room", "Bungalow"]
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
    const [hostels, setHostels] = useState<DummyHostelsType[] | null>()
    const [reloadHome, setReloadHome] = useState(false)

    useFocusEffect(useCallback(() => {
        const savedHostels = async () => {
            const favHostels = JSON.parse(await getItemAsync('SAVED') || "[]")
            setSavedIds(favHostels)
        }
        savedHostels()

    }, [reloadHome]))

    useEffect(() => {
        setHostels(dummyHostels)
    }, [savedIds])

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
                    <View style={{ width: scale(128), height: scale(128), borderRadius: 128, backgroundColor: '#d9d9d9' }}></View>
                </View>
                <Text style={[roboto.headlineSmallBold, { alignSelf: 'center', paddingTop: moderateScale(16) }]}>Timothy Okoli</Text>
            </View>

            <View style={[singleChatStyles.jCenter, singleChatStyles.row, globals.authContainer]}>
                <View style={[singleChatStyles.row, singleChatStyles.gap]}>
                    <Image source={images.orangeProfileTick} style={singleChatStyles.img} />
                    <Text style={[roboto.bodyLarge, colors.darkBurntOrange]}>Verified</Text>
                </View>

                <View style={[singleChatStyles.row, singleChatStyles.gap]}>
                    <Image source={images.darkOrangeStar} style={singleChatStyles.img} />
                    <Text style={[roboto.bodyLarge, colors.darkBurntOrange]}>4.6/5</Text>
                </View>

                <View style={[singleChatStyles.row, singleChatStyles.gap]}>
                    <Image source={images.like} style={singleChatStyles.img} />
                    <Text style={[roboto.bodyLarge, colors.darkBurntOrange]}>81%</Text>
                </View>
            </View>

            <View style={[globals.authContainer, singleChatStyles.row, singleChatStyles.jCenter, { paddingTop: 0 }]}>
                <TouchableOpacity style={[{ width: scale(171), height: verticalScale(44), borderRadius: 8, borderWidth: 1, borderColor: '#c7c7cc', justifyContent: "center", alignItems: "center" }, singleChatStyles.row, singleChatStyles.gap]}>
                    <Image source={images.greenCall} style={singleChatStyles.smallImg} />
                    <Text style={[roboto.mediumEmphasizedBold, colors.foundationWarningDark]}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[{ width: scale(171), height: verticalScale(44), borderRadius: 8, borderWidth: 1, borderColor: '#c7c7cc', justifyContent: "center", alignItems: "center" }, singleChatStyles.row, singleChatStyles.gap]}>
                    <Text style={[roboto.mediumEmphasizedBold, colors.foundationWarningDark]}>Message</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={{ backgroundColor: '#f5f5f5', flex: 1 }} contentContainerStyle={{ paddingBottom: verticalScale(50) }}>

                <ScrollView contentContainerStyle={{ paddingBottom: verticalScale(50) }} style={[{ width: scale(358), height: verticalScale(179), borderRadius: 16, borderWidth: 1, borderColor: '#e5e5ea', marginTop: moderateScale(16), alignSelf: 'center' }, globals.lightContainer, globals.authContainer]}>
                    <Text style={[roboto.titleSmallBold, { paddingBottom: 8 }]}>About Me</Text>
                    <Text style={[roboto.bodyLarge, colors.grays]}>{text.aboutme}</Text>
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
                    dummyHostels.slice(1, 3).map((hostel, index) =>
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
