import { getAllHostels } from "@/services/getAllHostels"
import { EnrichedHostel } from "@/types"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Dispatch, SetStateAction } from "react"

let lastRunAt = 0
let isRunning = false

// 30 minutes interval
const INTERVAL = 30 * 60 * 1000

// 5 seconds interval for tests
const INTERVAL_SEC = 5 * 1000

// cache list of all hostels
export const cacheHostels = async (force = false, setHostels: Dispatch<SetStateAction<EnrichedHostel[]>>) => {
    // prevent running multiple times concurrently
    if (isRunning) return

    // get the time now
    const now = Date.now()

    // return if it's not yet time to rerun
    if (!force && now - lastRunAt < INTERVAL_SEC) return

    // run and save lastRunAt to current time
    isRunning = true
    lastRunAt = now

    // for tests, replace with a call to get all hostels and save list of objects via async storage to "HOSTELS"
    console.log("ran")
    const apiHostels = await getAllHostels()
    if (apiHostels[0] == '200') {
        setHostels(apiHostels[1])
        await AsyncStorage.setItem('HOSTELS', JSON.stringify(apiHostels[1]))
        console.log("updated hostels")
    } else {
        //
    }

    isRunning = false
    return
}



