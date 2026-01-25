import axios from "axios"
import { BASE_URL, timeout } from "./apiConstants"
import { getItemAsync, setItemAsync } from "expo-secure-store"
import { router } from "expo-router"
import { toast } from "@/deps/toast"

export const getNewTokens = async () => {

    const oldRefreshToken = await getItemAsync("REFRESH_TOKEN") ?? ""

    try {
        const res = await axios.get(
            "/auth/token/refresh",
            {
                baseURL: BASE_URL,
                timeout: timeout,
                headers: {
                    "X-Refresh-Token": `Refresh ${oldRefreshToken}`
                }
            }
        )

        console.log("refreshed token")

        await setItemAsync("ACCESS_TOKEN", res.data["access_token"])
        await setItemAsync("REFRESH_TOKEN", res.data["refresh_token"])
        await setItemAsync("ID", res.data["id"])
        await setItemAsync("ROLE", res.data["role"])

    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {

            console.log(err?.status?.toString())
            console.log(err?.request)

            if (err.status?.toString() == "401") {
                router.replace('/auth/login')
                return false

            } else {
                toast("try again later")
                return false
            }
        }

    }

    return true
}
