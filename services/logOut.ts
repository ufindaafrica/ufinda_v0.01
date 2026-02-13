import axios from "axios"
import { BASE_URL, getAccessToken, getRefreshToken, timeout } from "./apiConstants"
import { deleteItemAsync } from "expo-secure-store"
import { api } from "./apiClient"
import AsyncStorage from "@react-native-async-storage/async-storage"

export const logOut = async () => {

    const result: Array<any> = []
    const refresh_token = await getRefreshToken()

    try {
        const res = await api.get(
            "/auth/logout",
            {
                headers: {
                    "X-Refresh-Token": `Refresh ${refresh_token}`
                }
            }
        )

        result[0] = "200"
        result[1] = res.data

        await deleteItemAsync("ACCESS_TOKEN")
        await deleteItemAsync("REFRESH_TOKEN")
        await deleteItemAsync('ID')
        await deleteItemAsync('ROLE')
        await deleteItemAsync('PROFILE')
        await AsyncStorage.removeItem('LISTINGS')
        await AsyncStorage.removeItem('VENDOR_INFO')
    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {

            result[0] = err.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")
        }

    }
    console.log(result)
    return result
}
