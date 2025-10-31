import axios from "axios"
import { BASE_URL } from "./apiConstants"

export const signUp = async (data : any) => {

    const result: Array<any> = []

    try {
        const res = await axios.post(
            "/auth/email/signup",
            data,
            {
                baseURL: BASE_URL,
                timeout: 5000,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        )

        result[0] = "201"
        result[1] = res.data["message"]

    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {

            result[0] = err.status?.toString()
            result[1] = err.response?.data["error"]
        }

    }

    return result
}
