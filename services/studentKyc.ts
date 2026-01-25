import axios from "axios"
import { api } from "./apiClient"

export const studentKyc = async (data : any) => {

    const result: Array<any> = []

    try {
        const res = await api.post(
            "/kyc/user",
            data,
            {
                headers: {
                    "Content-Type": "application/json"
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


export const vendorKyc = async (data : any) => {

    const result: Array<any> = []

    try {
        const res = await api.post(
            "/kyc/vendor",
            data,
            {
                headers: {
                    "Content-Type": "application/json"
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
