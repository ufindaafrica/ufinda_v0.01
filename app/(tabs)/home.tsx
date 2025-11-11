import AppHeader from "@/components/appHeader";
import Filter from "@/components/filter";
import HostelCard from "@/components/hostelCard";
import Search from "@/components/search";
import { dummyHostels, DummyHostelsType } from "@/constants/dummy_data";
import { globals } from "@/styles/globals";
import { homeStyles } from "@/styles/home";
import { useFocusEffect } from "expo-router";
import { getItem, getItemAsync, setItemAsync } from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";



export default function Home() {

    const [hostels, setHostels] = useState<DummyHostelsType[] | null>()

    const [currentFilter, setCurrentFilter] = useState("Near You")

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

    useFocusEffect(useCallback(() => {
        console.log("i fired")
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
        <SafeAreaView style={[globals.homeContainer]}>
            <View style={homeStyles.layoutMargin}>
                <AppHeader hostel />
            </View>

            <View style={homeStyles.layoutMargin}>
                <Search />
            </View>

            <View style={[homeStyles.layoutMargin, homeStyles.filterV]}>
                <View style={[homeStyles.eachFilterV, { zIndex: 2 }]}>
                    <Filter filterType="options" options={["Near You", "Recommended", "Others"]} visible={filter1Vis} setVisible={setVisiblility1} setCurrentFilter={setFilter} />
                </View>
                <View style={[homeStyles.eachFilterV, { zIndex: 2 }]}>
                    <Filter filterType="options" options={["Type", "SelfCon", "Flat", "Face Me"]} visible={filter2Vis} setVisible={setVisiblility2} setCurrentFilter={setFilter} />
                </View>
                <View style={homeStyles.eachFilterV}>
                    <Filter filterType="input" text="Min. Price" onInputFocus={inputFocus} setCurrentFilter={setFilter} />
                </View>
                <View style={homeStyles.eachFilterV}>
                    <Filter filterType="input" text="Max. Price" onInputFocus={inputFocus} setCurrentFilter={setFilter} />
                </View>
            </View>

            <View style={[homeStyles.layoutMargin]}>
                <Text style={homeStyles.currentOptionTxt}>{currentFilter}</Text>
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

