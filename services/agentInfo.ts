import axios from "axios"
import { api } from "./apiClient"

const agentInfo = async (vendorId: string) => {
    return await api.get(
        `/hostels/vendor/${vendorId}`
    )
}

export const getAgentInfo = async (vendorId: string) => {
    const result: Array<any> = []

    try {
        const res = await agentInfo(vendorId)

        result[0] = "200"
        result[1] = res.data

    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {
            result[0] = err.response?.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")

        }

    }
    // console.log(result[1].vendor_info)
    return result
}

const agentData = async () => {
    return await api.get(
        `/hostels/agents`
    )
}

export const getAgentData = async () => {
    const result: Array<any> = []

    try {
        const res = await agentData()

        result[0] = "200"
        result[1] = res.data

    } catch (err: unknown) {

        if (axios.isAxiosError(err)) {
            result[0] = err.response?.status?.toString()
            result[1] = err.response?.data["error"]

            if (result[1] == undefined) result[1] = ("Server Down. Try Again Later.")

        }

    }

    return result
}
