import { ChatMate } from "@/app/(vendor)/chat"
import { getAgentInfo } from "@/services/agentInfo"
import { createNewChat } from "@/services/newChat"
import { router } from "expo-router"
import { getItemAsync } from "@/deps/secureStorage"


export const handleNewChat = async (id: string, book?: string) => {
    const userId = await getItemAsync('ID') ?? ""

    const data = {
        buyer_id: userId,
        vendor_id: id
    }

    const newchat = await createNewChat(data)

    if (newchat[0] == "200") {
        const chatMateData = await getAgentInfo(id)
        let finalData: any
        if (chatMateData[0] == "200") {
            const thedata = chatMateData?.[1]?.[0]?.vendor_info
            finalData = {
                name: `${thedata?.first_name ?? ""} ${thedata?.last_name ?? ""}`,
                profile_img: thedata?.vendor_kyc?.profile_img?.url ?? "",
                phone_number: thedata?.phone ?? "",
                id: id
            }
        } else {
            finalData = {}
        }
        console.log("newchat =>", newchat)
        console.log(newchat[1])
        router.push({
            pathname: '/pages/singleChat',
            params: {
                id: newchat[1],
                vendor_id: id,
                ...(book && { book: `I want to book ${book}` }),
                ...(finalData && {chatmate_data: JSON.stringify(finalData) ?? "{}"})
            }
        })
        console.log("buyer id => ", userId)
        console.log("vendor_id => ", id)
    }
    return
}
