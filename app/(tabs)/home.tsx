import AppHeader from "@/components/appHeader";
import Filter from "@/components/filter";
import HostelCard from "@/components/hostelCard";
import Search from "@/components/search";
import { getAllHostels } from "@/services/getAllHostels";
import { globals, roboto } from "@/styles/globals";
import { homeStyles } from "@/styles/home";
import { EnrichedHostel } from "@/types";
import { getItemAsync, setItemAsync } from "expo-secure-store";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function Home() {

    const [hostels, setHostels] = useState<Array<EnrichedHostel> | null>()

    const [currentFilter, setCurrentFilter] = useState("New Listings")

    const setFilter = (text: string, type: "options" | "input" | "search") => {
        if (type === "options" || type === "search") {
            setCurrentFilter(text)
            return
        }

        if (type === "input" && (currentFilter.startsWith("Min") || currentFilter.startsWith("Max")) && (currentFilter.slice(0, 3) != (text.slice(0, 3)))) {
            if (currentFilter.slice(0, 3) == "Max") {
                setCurrentFilter(prev => text + " - " + prev)
            } else {
                const preText = currentFilter.includes(" - Max") ? currentFilter.slice(0, currentFilter.indexOf(" - Max")) : currentFilter
                setCurrentFilter(preText + " - " + text)
            }

        } else {
            setCurrentFilter(text)
        }

        return
    }

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

    const inputFocus = () => {
        setFilter1Vis(false)
        setFilter2Vis(false)
    }

    
    const [savedIds, setSavedIds] = useState<Array<string>>([])
    const [ reloadHome, setReloadHome ] = useState(false)

    // useFocusEffect(useCallback(() => {
    //     const savedHostels = async () => {
    //         const favHostels = JSON.parse(await getItemAsync('SAVED') || "[]")
    //         setSavedIds(favHostels)
    //     }
    //     savedHostels()
        
    // }, [reloadHome]))

    useEffect(() => {
        const savedHostelData = async () => {
            setHostels(JSON.parse(await AsyncStorage.getItem('HOSTELS') ?? "[]"))
        }
        const savedHostels = async () => {
            const favHostels = JSON.parse(await getItemAsync('SAVED') || "[]")
            setSavedIds(favHostels)
        }
        savedHostelData()
        savedHostels()
    }, [])

    useEffect(() => {
        allHostels()
    }, [savedIds])

    const allHostels = async () => {
        const apiHostels = await getAllHostels()

        if (apiHostels[0] == '200') {
            setHostels(apiHostels[1])
            await AsyncStorage.setItem('HOSTELS', JSON.stringify(apiHostels[1]))
        }

        return
    }

    return (
        <SafeAreaView style={[globals.homeContainer]}>
            <View style={homeStyles.layoutMargin}>
                <AppHeader hostel />
            </View>

            <View style={homeStyles.layoutMargin}>
                <Search />
            </View>

            <View style={[{ marginBottom: 8 }, homeStyles.filterV]}>
                <View style={[homeStyles.eachFilterV, { zIndex: 2, paddingRight: 8 }]}>
                    <Filter filterType="options" options={["New", "Near You", "Your State", "Recommended"]} visible={filter1Vis} setVisible={setVisiblility1} setCurrentFilter={setFilter} active />
                </View>
                <View style={[homeStyles.eachFilterV, { zIndex: 2 }]}>
                    <Filter filterType="options" options={["Type", "Self Contained", "Single Room", "1 Bedroom Flat", "2 Bedroom Flat", "3 Bedroom Flat", "Room in a Flat"]} visible={filter2Vis} setVisible={setVisiblility2} setCurrentFilter={setFilter} />
                </View>
                <View style={[homeStyles.eachFilterV, { paddingRight: 8 }]}>
                    <Filter filterType="input" text="Min. Price" onInputFocus={inputFocus} setCurrentFilter={setFilter} />
                </View>
                <View style={homeStyles.eachFilterV}>
                    <Filter filterType="input" text="Max. Price" onInputFocus={inputFocus} setCurrentFilter={setFilter} />
                </View>
            </View>

            <View style={{ marginBottom: 8 }}>
                <Text style={roboto.bodyLargeBold}>{currentFilter}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={homeStyles.scrollV}>
                {
                    hostels ? hostels.map((item, idx) => (
                        <View style={homeStyles.layoutMargin} key={idx}>
                            <HostelCard
                                hostel={item}
                                isSaved={savedIds.includes(item.id)}
                                reload={() => setReloadHome(!reloadHome)}
                            />
                        </View>
                    )) : null
                }
            </ScrollView>
        </SafeAreaView>
    )
}

