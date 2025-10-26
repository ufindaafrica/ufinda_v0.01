import AppHeader from "@/components/appHeader";
import Filter from "@/components/filter";
import HostelCard from "@/components/hostelCard";
import Search from "@/components/search";
import { globals } from "@/styles/globals";
import { homeStyles } from "@/styles/home";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";



export default function Home() {

    const [currentFilter, setCurrentFilter] = useState("Near You")

    const setFilter = (text: string, type: "options" | "input" | "search") => {
        if (type === "options" || type === "search") {
            setCurrentFilter(text)
            console.log(currentFilter)
            console.log(type)
            return
        }

        if (type === "input" && (currentFilter.startsWith("Min") || currentFilter.startsWith("Max")) && (currentFilter.slice(0, 3) != (text.slice(0, 3)))) {
            console.log("i saw the light")
            if (currentFilter.slice(0, 3) == "Max") {
                setCurrentFilter(prev => text + " - " + prev)
            } else {
                const preText = currentFilter.includes(" - Max") ? currentFilter.slice(0, currentFilter.indexOf(" - Max")) : currentFilter
                setCurrentFilter(preText + " - " + text)
            }

        } else {
            console.log("it was me")
            console.log(currentFilter.startsWith("Min"))
            console.log(currentFilter.startsWith("Max"))
            console.log(type)
            setCurrentFilter(text)
        }

        console.log(currentFilter)

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

    return (
        <SafeAreaView style={[globals.container, globals.authContainer]}>
            <View style={homeStyles.layoutMargin}>
                <AppHeader />
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

            <ScrollView>
                <HostelCard />
            </ScrollView>
        </SafeAreaView>
    )
}

