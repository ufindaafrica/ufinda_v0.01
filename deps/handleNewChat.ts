import { createNewChat } from "@/services/newChat"
import { router } from "expo-router"
import { getItemAsync } from "expo-secure-store"


export const handleNewChat = async (id: string, book?: string) => {
    const userId = await getItemAsync('ID') ?? ""

    const data = {
        buyer_id: userId,
        vendor_id: id
    }

    const newchat = await createNewChat(data)

    if (newchat[0] == "200") {
        console.log("newchat =>", newchat)
        console.log(newchat[1])
        router.push({
            pathname: '/pages/singleChat',
            params: {
                id: newchat[1],
                vendor_id: id,
                ...(book && {book: `I want to book ${book}`})
            }
        })
        console.log("buyer id => ", userId)
        console.log("vendor_id => ", id)
    }
}
