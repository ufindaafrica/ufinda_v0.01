import axios from "axios"
import { BASE_URL, getAccessToken, timeout } from "./apiConstants"

export const getUploadSignature = async () => {

    console.log("first")

    const result: Array<any> = []
    const token = await getAccessToken()

    try {
        console.log("first block")
        const res = await axios.get(
            "/hostels/signature",
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

        console.log(res.data)

    } catch (err: unknown) {

        console.log("i am here")

        if (axios.isAxiosError(err)) {
            console.log(err)

            result[0] = err.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")
        }

        console.log(result)

    }

    return result
}
