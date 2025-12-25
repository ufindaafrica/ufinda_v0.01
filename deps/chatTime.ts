import { Message } from "@/app/pages/singleChat"

export const lastMessageSentTime = (dateString: string | null | undefined) => {

    if (dateString) {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()

        if (diff >= 0 && diff <= 24 * 60 * 60 * 1000) return date.toLocaleTimeString('en-NG', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).toLowerCase()
        if (diff >= 0 && diff <= 48 * 60 * 60 * 1000) return "Yesterday"
        if (diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000) return date.toLocaleDateString('en-NG', { weekday: 'long' })
        else return date.toLocaleDateString('en-NG')
    }

    return ""
}

export const isLastInGroup = (idx: number, messages: Array<Message>) => {
    const isLast = Array.isArray(messages) && idx === messages.length - 1
    if (isLast) return true
    else {
        const isSame = Array.isArray(messages) && messages[idx].sender_id === messages[idx + 1].sender_id
        if (isSame) return false
        else return true
    }
}


export const isLast = (idx: number, messages: Array<Message>) => {
    const isLast = Array.isArray(messages) && idx === messages.length - 1
    if (isLast) {
        return true
    }
    else return false
}
