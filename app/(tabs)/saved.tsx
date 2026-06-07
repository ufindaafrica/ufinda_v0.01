import AppHeader from "@/components/appHeader";
import Filter from "@/components/filter";
import HostelCard from "@/components/hostelCard";
import Search from "@/components/search";
import { text } from "@/constants/texts";
import { toast } from "@/deps/toast";
import { allSavedHostels } from "@/services/saveHostel";
import { searchHostels } from "@/services/searchHostels";
import { globals } from "@/styles/globals";
import { homeStyles } from "@/styles/home";
import { EnrichedHostel } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { View } from "react-native";
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

    const handleSetCurrentFilter = async (filter: string) => {
        setCurrentFilter(filter)
    }

    const [savedHostels, setSavedHostels] = useState<Array<EnrichedHostel>>([])

    const [reloadSave, setReloadSave] = useState(false)

    const getSavedHostels = async () => {
        const savedHostels: Array<EnrichedHostel> = JSON.parse(await AsyncStorage.getItem("SAVED") || "[]")
        const savedBefore = await AsyncStorage.getItem("SAVED_BEFORE")

        let savedHostelData: Array<EnrichedHostel> = []

        if (savedHostels.length > 0 && savedBefore) {
            savedHostelData = savedHostels
        } else {
            const savedHs = await allSavedHostels()
            if (savedHs[0] != "200") {
                toast("error getting saved hostels. try again.")
                return
            }
            savedHostelData = savedHs[1]
            await AsyncStorage.setItem("SAVED", JSON.stringify(savedHs[1]))
            await AsyncStorage.setItem("SAVED_BEFORE", "true")
        }

        return savedHostelData
    }

    useEffect(() => {
        const hostels = async () => {
            const hostelData = await getSavedHostels() ?? []
            setSavedHostels(hostelData)
        }

        hostels()
    }, [reloadSave])

    useEffect(() => {
        const hostels = async () => {
            const hostelData = await getSavedHostels() ?? []
            setSavedHostels(hostelData)
        }
        
        hostels()
    }, [])

    useEffect(() => {
        const filterChanged = async () => {
            if (currentFilter == "Categories") {
                const all = await getSavedHostels() ?? []
                setSavedHostels(all)
                return
            }

            const allSavedHostels: Array<EnrichedHostel> = JSON.parse(await AsyncStorage.getItem("SAVED") || "[]")

            const filteredList = allSavedHostels.filter((hostel) => hostel.room_type.toLowerCase() == currentFilter.toLowerCase())

            console.log("filtered list =>", filteredList)

            setSavedHostels(filteredList)

            // const searchFilter = await searchHostels({ type: currentFilter })
            // if (searchFilter[0] != "200") {
            //     toast("error searching saved hostels. try again.")
            //     setCurrentFilter("Categories")
            //     return
            // }

            // const savedHostels: Array<string> = JSON.parse(await AsyncStorage.getItem("SAVED") || "[]")

            // const savedOptions: Array<EnrichedHostel> = searchFilter[1].filter((hostel: EnrichedHostel) => savedHostels.includes(hostel.id))

            // setSavedHostels(savedOptions)

            console.log("nothing")
        }

        filterChanged()

    }, [currentFilter])

    return (
        <SafeAreaView style={globals.homeContainer}>
            <View style={homeStyles.layoutMargin}>
                <AppHeader hostel />
            </View>

            <View style={homeStyles.layoutMargin}>
                <Search />
            </View>

            <View style={[homeStyles.layoutMargin, { flexDirection: "row", justifyContent: "space-between", width: "100%", zIndex: 1000 }]}>
                <View style={homeStyles.eachSavedFilterV}>
                    <Filter filterType="options" options={["Categories", ...text.hosteltypes]} setCurrentFilter={handleSetCurrentFilter} visible={filter1Vis} setVisible={setVisiblility1} />
                </View>
                <View style={homeStyles.eachSavedFilterV}>
                    <Filter filterType="options" options={["Sort", "Price", "Name", "Near"]} setCurrentFilter={setCurrentSort} visible={filter2Vis} setVisible={setVisiblility2} />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={homeStyles.scrollV}>
                {
                    savedHostels?.length > 0 ?
                        [...savedHostels].reverse().map((item, idx) =>
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

