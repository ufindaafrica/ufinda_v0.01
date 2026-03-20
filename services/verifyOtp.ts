import axios from "axios"
import { BASE_URL, timeout } from "./apiConstants"
import { setItemAsync } from "expo-secure-store"

export const verifyOtp = async (data : any) => {

    const result: Array<any> = []

    try {
        const res = await axios.post(
            "/auth/verify-otp",
            data,
            {
                baseURL: BASE_URL,
                timeout: timeout,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        )

        result[0] = "200"
        result[1] = res.data["message"]

        await setItemAsync("ACCESS_TOKEN", res.data["access_token"])
        await setItemAsync("REFRESH_TOKEN", res.data["refresh_token"])

        console.log(res.data["access_token"])

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
