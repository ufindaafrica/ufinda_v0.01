import axios from "axios";
import { BASE_URL, getAccessToken, timeout } from "./apiConstants";
import { api } from "./apiClient";


export const getVendorOtpUrl = async () => {
    
    const result: Array<any> = []

    try {
        const res = await api.get(
            "/kyc/vendor",
            {
                headers: {
                    "Content-Type": "application/json",
                }
            }
        )

        result[0] = "200"
        result[1] = res.data["message"]

    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {

            result[0] = err.status?.toString()
            result[1] = err.response?.data["error"]

            console.log(result[0])

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")
        }

    }

    return result
}
