import { getItemAsync } from "expo-secure-store"


export const BASE_URL = "https://ufinda-v0-01.onrender.com"

export const getAccessToken = async () => {
    return await getItemAsync("ACCESS_TOKEN")
}

export const timeout = 15000
