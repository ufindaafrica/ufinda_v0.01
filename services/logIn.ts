import axios from "axios"
import { BASE_URL } from "./apiConstants"
import { setItemAsync } from "expo-secure-store"

export const logIn = async (data : any) => {

    const result: Array<any> = []

    try {
        const res = await axios.post(
            "/auth/email/login",
            data,
            {
                baseURL: BASE_URL,
                timeout: 5000,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        )

        result[0] = "200"

        await setItemAsync("ACCESS_TOKEN", res.data["access_token"])
        await setItemAsync("REFRESH_TOKEN", res.data["refresh_token"])

    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {

            result[0] = err.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")
        }

    }

    return result
}
