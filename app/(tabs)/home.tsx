import AppHeader from "@/components/appHeader";
import Filter from "@/components/filter";
import HostelCard from "@/components/hostelCard";
import Search from "@/components/search";
import { getAllHostels } from "@/services/getAllHostels";
import { globals, roboto } from "@/styles/globals";
import { homeStyles } from "@/styles/home";
import { EnrichedHostel } from "@/types";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Animated, AppState, AppStateStatus, FlatList, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { searchHostels, searchParams } from "@/services/searchHostels";
import { toast } from "@/deps/toast";
import { text } from "@/constants/texts";
import { router } from "expo-router";
import { getRole } from "@/deps/getRole";
import * as Location from 'expo-location';
import { getDistance } from 'geolib'
import { cacheHostels } from "@/deps/cacheServices";


/// start and stop foreground service to schedule cache calls

let timer: ReturnType<typeof setInterval> | null = null

// start foreground service function
const startForegroundScheduler = (setHostels: Dispatch<SetStateAction<EnrichedHostel[]>>) => {
    // return if a timer is already running
    if (timer) return

    // continue to create new timer
    timer = setInterval(() => {
        cacheHostels(false, setHostels)
    }, 30 * 60 * 1000)

}

// stop foreground service function
const stopForegroundScheduler = () => {
    // stop only if timer is not null
    if (timer) {
        clearInterval(timer)
        timer = null
    }
}


export default function Home() {

    const [hostels, setHostels] = useState<Array<EnrichedHostel>>([])
    const [searchedHostels, setSearchedHostels] = useState<Array<EnrichedHostel>>([])

    const [currentFilter, setCurrentFilter] = useState("New")

    const [searchFilters, setSearchFilters] = useState<searchParams | null>({})

    const filterNearYou = async () => {
        setHostels(prev => {
            if (loc != null && loc != undefined) {
                const sorted = [...prev].sort((a, b) => getDistance(loc, a?.geolocation ?? loc) - getDistance(loc, b?.geolocation ?? loc))
                console.log("lennn", sorted.length)
                return sorted
            } else {
                return prev
            }
        })
    }

    const setFilter = (text: string, type: "options" | "input" | "search") => {
        // for the first two filters for New and for Hostel Type
        // sets search filter and also current filter text
        if (type === "options") {
            if (text == "Near You") {
                console.log("in near you")
                setCurrentFilter("Near You")
                filterNearYou()
                return
            }
            if (text === city) {
                setCurrentFilter(city)
                setSearchFilters(prev => ({
                    ...prev,
                    q: city
                }))
                return
            }

            if (text != "New" && text != "Near You" && text != "Recommended" && text != "Type") {
                setSearchFilters(prev => ({
                    ...prev,
                    type: text
                }))
            }
            if (text === "Type") {
                setSearchFilters(prev => {
                    if (!prev) return prev

                    const { type, ...rest } = prev
                    return rest
                })
            }

            setCurrentFilter(text)
        }

        // for texts coming from the search bar
        if (type === "search") {
            setSearchFilters(prev => ({
                ...prev,
                q: text
            }))
            setCurrentFilter(text)
        }

        // for texts in Min and Max filters
        // only sets current filter text
        if (type === "input" && (currentFilter.startsWith("Min") || currentFilter.startsWith("Max")) && (currentFilter.slice(0, 3) != (text.slice(0, 3)))) {
            if (currentFilter.slice(0, 3) == "Max") {
                setCurrentFilter(prev => text + " - " + prev)
            } else {
                const preText = currentFilter.includes(" - Max") ? currentFilter.slice(0, currentFilter.indexOf(" - Max")) : currentFilter
                setCurrentFilter(preText + " - " + text)
            }

        } else {
            setSearchFilters(prev => {
                if (!prev) return prev

                const { price_max, ...rest } = prev
                return rest
            })
            setCurrentFilter(text)
        }

        // for texts in Min and Max fields
        // sets for the searchFilters
        if (type === "input") {
            if (text.startsWith("Min")) {
                const min = Number(text.slice(12))
                const rawMax = Number(searchFilters?.price_max) ?? 0
                const max = Number.isNaN(rawMax) ? 0 : rawMax

                if (min >= max && max > 0) {
                    toast("Min Price must be less than Max")
                    setCurrentFilter("New")
                }

                else {
                    setSearchFilters(prev => ({
                        ...prev,
                        price_min: min.toString()
                    }))
                }

            } else {
                const max = Number(text.slice(12))
                const rawMin = Number(searchFilters?.price_min) ?? 0
                const min = Number.isNaN(rawMin) ? 0 : rawMin

                if (max <= min && min > 0) {
                    toast("Max Price must be greater than Min")
                    setCurrentFilter("New")
                }

                else {
                    setSearchFilters(prev => ({
                        ...prev,
                        price_max: max.toString()
                    }))
                }

            }
        }
        return
    }

    useEffect(() => {

        const search = async () => {

            if (searchFilters && Object.keys(searchFilters).length > 0) {
                const filteredHostels = await searchHostels(searchFilters ?? {})

                if (filteredHostels[0] == "200") {
                    // setCurrentFilter(prev => {
                    //     return Object.entries(searchFilters).map(([key, value]) => `${key}: ${value}`).join(" ; ")
                    // })
                    setSearchedHostels(filteredHostels[1])
                } else {
                    toast("error. try searching again.")
                }
            }
        }

        search()

    }, [searchFilters])

    useEffect(() => {
        console.log("hostels reloaded")
    }, [hostels])

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
    const [reloadHome, setReloadHome] = useState(false)

    useEffect(() => {
        const savedHostelData = async () => {
            setHostels(JSON.parse(await AsyncStorage.getItem('HOSTELS') ?? "[]"))
        }
        const savedHostels = async () => {
            const favHostels = JSON.parse(await AsyncStorage.getItem('SAVED') || "[]")
            setSavedIds(favHostels)
            // console.log(await getRole())
        }
        savedHostelData()
        savedHostels()
    }, [])

    useEffect(() => {
        allHostels()
    }, [])

    const allHostels = async () => {
        const apiHostels = await getAllHostels()
        // console.log(apiHostels[1][0])

        if (apiHostels[0] == '200') {
            setHostels(apiHostels[1])
            // await AsyncStorage.setItem('HOSTELS', JSON.stringify(apiHostels[1]))
        } else {
            router.replace("/auth/login")
        }
        return
    }

    const [city, setCity] = useState<any>("")
    const [loc, setLoc] = useState<any>()

    useEffect(() => {
        const getLocation = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync()
            if (status != "granted") {
                return
            }

            const loc = await Location.getCurrentPositionAsync({})

            const address = await Location.reverseGeocodeAsync(loc.coords)

            if (address.length > 0) {
                const formatted = address[0].region
                setCity(formatted)

                const coords = {
                    "latitude": loc?.coords?.latitude ?? 0,
                    "longitude": loc?.coords?.longitude ?? 0
                }
                setLoc(coords)
            }
        }
        getLocation()
    }, [])

    useEffect(() => {
        const handleState = (state: AppStateStatus) => {
            if (state === "active") {
                console.log("first run")
                startForegroundScheduler(setHostels)
            } else {
                stopForegroundScheduler()
            }
        }

        handleState(AppState.currentState)

        const sub = AppState.addEventListener("change", handleState)

        return () => sub.remove()
    }, [])

    const [refreshing, setRefreshing] = useState(false)
    const pullOffset = useRef(new Animated.Value(0)).current

    const onRefresh = async () => {
        setRefreshing(true)
        await allHostels()
        setRefreshing(false)
    }

    useEffect(() => {
        Animated.timing(pullOffset, {
            toValue: refreshing ? 50 : 0,
            duration: 300,
            useNativeDriver: true
        }).start()
    }, [refreshing])

    return (
        <SafeAreaView style={[globals.homeContainer]}>
            <View style={homeStyles.layoutMargin}>
                <AppHeader hostel />
            </View>

            <View style={homeStyles.layoutMargin}>
                <Search searchHostels={setFilter} />
            </View>

            <View style={[{ marginBottom: 8 }, homeStyles.filterV]}>
                <View style={[homeStyles.eachFilterV, { zIndex: 2, paddingRight: 8 }]}>
                    <Filter filterType="options" options={["New", "Near You", `${city}`, "Recommended"]} visible={filter1Vis} setVisible={setVisiblility1} setCurrentFilter={setFilter} active />
                </View>
                <View style={[homeStyles.eachFilterV, { zIndex: 2 }]}>
                    <Filter filterType="options" options={["Type", ...text.hosteltypes]} visible={filter2Vis} setVisible={setVisiblility2} setCurrentFilter={setFilter} />
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

            <Animated.View style={{
                transform: [{ translateY: pullOffset }],
                paddingBottom: 200
                // flex: 1
            }}>
                <FlatList
                    data={hostels ? currentFilter === "New" || currentFilter === "Near You" ? hostels : searchedHostels : []}
                    renderItem={({ item }) => <View style={[homeStyles.layoutMargin, { marginVertical: 8 }]} key={item.id ?? ""}>
                        <HostelCard hostel={item ?? {}} isSaved={savedIds.includes(item.id ?? "")} reload={() => setReloadHome(!reloadHome)} coords={loc} />
                    </View>}
                    keyExtractor={item => item.id}
                    contentContainerStyle={homeStyles.scrollV}
                    showsVerticalScrollIndicator={false}
                    refreshing={refreshing}
                    onRefresh={onRefresh} />
            </Animated.View>

        </SafeAreaView>
    )
}


// old -- will remove later

{/* <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={homeStyles.scrollV}>
                {
                    // hostels ? (currentFilter === "New" ? hostels : searchedHostels).map((item, idx) => (
                    //     <View style={homeStyles.layoutMargin} key={idx}>
                    //         <HostelCard
                    //             hostel={item}
                    //             isSaved={savedIds.includes(item.id)}
                    //             reload={() => setReloadHome(!reloadHome)}
                    //             coords={loc}
                    //         />
                    //     </View>
                    // )) : null
                } */}
{/* </ScrollView> */ }