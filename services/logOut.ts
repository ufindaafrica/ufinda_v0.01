import axios from "axios"
import { BASE_URL, getAccessToken, getRefreshToken, timeout } from "./apiConstants"
import { deleteItemAsync } from "expo-secure-store"

export const logOut = async () => {

    const result: Array<any> = []
    const token = await getAccessToken()
    const refresh_token = await getRefreshToken()

    try {
        const res = await axios.post(
            "/auth/logout",
            {},
            {
                baseURL: BASE_URL,
                timeout: timeout,
                headers: {
                    Authorization: `Bearer ${token}`,
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
