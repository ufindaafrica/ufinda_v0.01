import axios from "axios"
import { BASE_URL, getAccessToken } from "./apiConstants"

export const studentKyc = async (data : any) => {

    const token = await getAccessToken()
    const result: Array<any> = []

    try {
        const res = await axios.post(
            "/kyc/user",
            data,
            {
                baseURL: BASE_URL,
                timeout: 5000,
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${token}`
                }
            }
        )

        result[0] = "200"
        result[1] = res.data["message"]

    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {

            result[0] = err.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")
        }

    }

    return result
}
