import { getItemAsync } from "expo-secure-store"


export const BASE_URL = __DEV__ ? "https://ufinda-v0-01.onrender.com" : "https://ufinda-v0-01-2prv.onrender.com"
export const BARE_URL = __DEV__ ? "ufinda-v0-01.onrender.com" : "ufinda-v0-01-2prv.onrender.com"

// https://ufinda-v0-01-2prv.onrender.com/ 

export const getAccessToken = async () => {
    return await getItemAsync("ACCESS_TOKEN")
}

export const getRefreshToken = async () => {
    return await getItemAsync("REFRESH_TOKEN")
}

export const timeout = 15000
