import { inputStyles } from "@/styles/componentStyles/input";
import { forwardRef, useState } from "react";
import { ReturnKeyTypeOptions, Text, TextInput, TextInputProps, View } from "react-native";

type inputProps = {
    label: string,
    hint?: string,
    onFocus?: (value: any) => void,
    onSubmitEditing?: (value: any) => void,
    returnKeyType?: string
} & TextInputProps

const Input = forwardRef<TextInput, inputProps>(({ label, hint, onFocus, onSubmitEditing, returnKeyType, ...props }: inputProps, ref) => {

    const [focused, setFocused] = useState(false)

    return (
        <View>
            <Text style={inputStyles.label}>{label}</Text>

            <TextInput
                ref={ref}
                style={[inputStyles.gen, inputStyles.inputBox, focused ? inputStyles.focusedInputBox : null]}
                placeholder={hint}
                placeholderTextColor={"#c7c7cc"}
                onChange={() => {
                    setFocused(true)
                }}
                numberOfLines={1}
                onFocus={(e) => onFocus?.(e)}
                returnKeyType={returnKeyType as ReturnKeyTypeOptions}
                onSubmitEditing={onSubmitEditing}
                submitBehavior="submit"
                {...props}
            />
        </View>
    )
})

Input.displayName = "Input"
export default Input
