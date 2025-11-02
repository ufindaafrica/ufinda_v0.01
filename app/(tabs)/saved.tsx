import AppHeader from "@/components/appHeader";
import Filter from "@/components/filter";
import HostelCard from "@/components/hostelCard";
import Search from "@/components/search";
import { dummyHostels, DummyHostelsType } from "@/constants/dummy_data";
import { globals } from "@/styles/globals";
import { homeStyles } from "@/styles/home";
import { useFocusEffect } from "expo-router";
import { getItemAsync } from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Saved() {

    const [currentFilter, setCurrentFilter] = useState("Categories")
    const [currentSort, setCurrentSort] = useState("Sort")

    const [filter1Vis, setFilter1Vis] = useState(false)
    const [filter2Vis, setFilter2Vis] = useState(false)

    const setVisiblility1 = (visibility: boolean) => {
        setFilter1Vis(visibility)
        setFilter2Vis(false)
    }

    const setVisiblility2 = (visibility: boolean) => {
        setFilter2Vis(visibility)
        setFilter1Vis(false)
    }

    const [savedHostels, setSavedHostels] = useState<Array<DummyHostelsType>>([])
    const [reloadSave, setReloadSave] = useState(false)

    const getSavedHostels = async () => {
        const savedHostels: Array<string> = JSON.parse(await getItemAsync("SAVED") || "[]")
        let savedHostelData: Array<DummyHostelsType> = []

        if (savedHostels.length > 0) {
            savedHostelData = dummyHostels
                                .filter(item => savedHostels.includes(item.id))
                                .sort((a, b) => savedHostels.indexOf(b.id) - savedHostels.indexOf(a.id))
        }

        return savedHostelData
    }

    useEffect(() => {
        const hostels = async () => {
            const hostelData = await getSavedHostels()
            setSavedHostels(hostelData)
        }

        hostels()
    }, [reloadSave])

    useFocusEffect(useCallback(() => {
        const hostels = async () => {
            const hostelData = await getSavedHostels()
            setSavedHostels(hostelData)
        }

        hostels()
    }, []))

    return (
        <SafeAreaView style={globals.homeContainer}>
            <View style={homeStyles.layoutMargin}>
                <AppHeader />
            </View>

            <View style={homeStyles.layoutMargin}>
                <Search />
            </View>

            <View style={[homeStyles.layoutMargin, { flexDirection: "row", justifyContent: "space-between", width: "100%" }]}>
                <View style={homeStyles.eachFilterV}>
                    <Filter filterType="options" options={["Categories", "Hostel Type"]} setCurrentFilter={setCurrentFilter} visible={filter1Vis} setVisible={setFilter1Vis} />
                </View>
                <View style={homeStyles.eachFilterV}>
                    <Filter filterType="options" options={["Sort", "Price", "Name", "Near"]} setCurrentFilter={setCurrentSort} visible={filter2Vis} setVisible={setFilter2Vis} />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={homeStyles.scrollV}>
                {
                    savedHostels?.length > 0 ?
                        savedHostels.map((item, idx) =>
                            <View key={item.id} style={homeStyles.layoutMargin}>
                                <HostelCard
                                    hostel={item}
                                    isSaved={true}
                                    reload={() => setReloadSave(!reloadSave)}
                                />
                            </View>
                        )
                        : null
                }
            </ScrollView>
        </SafeAreaView>


    )
}

