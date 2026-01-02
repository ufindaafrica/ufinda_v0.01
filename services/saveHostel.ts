import axios from "axios"
import { getAccessToken, timeout } from "./apiConstants"


export const saveHostel = async (id: string) => {
    const result: Array<any> = []
    const token = await getAccessToken()

    try {
        const res = await axios.post(
            `/hostels/${id}`,
            {
                timeout: timeout,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )

        result[0] = "200"
        result[1] = res.data
    } catch (err) {
        if (axios.isAxiosError(err)) {

            result[0] = err.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")
        }
    } finally {
        return result
    }
}
