import axios from "axios"
import { BASE_URL, timeout } from "./apiConstants"
import { setItemAsync } from "expo-secure-store"
import { ScreenStackItem } from "react-native-screens"

export const logIn = async (data : any) => {

    const result: Array<any> = []

    try {
        const res = await axios.post(
            "/auth/email/login",
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
        result[1] = res.data["role"]

        await setItemAsync("ACCESS_TOKEN", res.data["access_token"])
        await setItemAsync("REFRESH_TOKEN", res.data["refresh_token"])
        await setItemAsync("ID", res.data["id"])
        await setItemAsync("ROLE", res.data["role"])
        await setItemAsync("MODE", res.data["role"])

        console.log(result)
    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {

            result[0] = err.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")
        }

    }

    return result
}
