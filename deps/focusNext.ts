import { TextInput } from "react-native"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"

export const focusNext = (nextRef: React.RefObject<TextInput | null>, scrollRef: React.RefObject<KeyboardAwareScrollView | null>) => {
        const nextInput = nextRef.current
        if (!nextInput) return
        nextInput.focus()
        scrollRef.current?.scrollToFocusedInput(nextInput)
    }
