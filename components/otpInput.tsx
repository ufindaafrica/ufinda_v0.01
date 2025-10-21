import { otpInputStyles } from "@/styles/componentStyles/otpInput"
import { forwardRef } from "react"
import { TextInput, TextInputComponent } from "react-native"

type OtpInputProps = {
    // refId: string
}


const OtpInput = forwardRef<TextInput, OtpInputProps>(({ ...props }: OtpInputProps, ref) => {

    return (
        <TextInput
            ref={ref}
            style={otpInputStyles.main}
            cursorColor={"transparent"}
        />
    )
})


export default OtpInput
