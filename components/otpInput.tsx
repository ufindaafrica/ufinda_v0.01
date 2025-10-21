import { otpInputStyles } from "@/styles/componentStyles/otpInput"
import { forwardRef, useState } from "react"
import { TextInput } from "react-native"

type OtpInputProps = {
    value: string,
    valueChange: (value: string, value2: number) => void,
    index: number
}


const OtpInput = forwardRef<TextInput, OtpInputProps>(({ value, valueChange, index, ...props }: OtpInputProps, ref) => {

    const [ focused, setFocused ] = useState(false)

    return (
        <TextInput
            ref={ref}
            style={[otpInputStyles.main, focused && otpInputStyles.focusedMain]}
            cursorColor={"transparent"}
            keyboardType="numeric"
            value={value}
            onChangeText={(text) => {
                valueChange(text.slice(-1), index)
                setFocused(false)
            }}
            onFocus={() => {
                setFocused(true)
            }}
        />
    )
})


export default OtpInput
