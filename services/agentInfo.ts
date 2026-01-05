import axios from "axios"
import { BASE_URL, getAccessToken, timeout } from "./apiConstants"

export const getAgentInfo = async (vendorId: string) => {

    const token = await getAccessToken()
    const result: Array<any> = []

    try {
        const res = await axios.get(
            `/hostels/vendor/${vendorId}`,
            {
                baseURL: BASE_URL,
                timeout: timeout,
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        )

        result[0] = "200"
        result[1] = res.data

    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {

            result[0] = err.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")
        }

    }
    // console.log(result[1].vendor_info)
    return result
}

