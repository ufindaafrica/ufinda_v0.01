import { inputStyles } from "@/styles/componentStyles/input";
import { roboto } from "@/styles/globals";
import { forwardRef, useState } from "react";
import { Image, ReturnKeyTypeOptions, Text, TextInput, TextInputProps, TouchableOpacity, View } from "react-native";

type inputProps = {
    label?: string,
    hint?: string,
    onFocus?: (value: any) => void,
    onSubmitEditing?: (value: any) => void,
    returnKeyType?: string,
    invalid?: boolean,
    icon?: any,
    secureText?: boolean,
    setSecureText?: (value: any) => void
} & TextInputProps

const Input = forwardRef<TextInput, inputProps>(({ label, hint, onFocus, onSubmitEditing, returnKeyType, invalid, icon, secureText, setSecureText, ...props }: inputProps, ref) => {

    const [focused, setFocused] = useState(false)

    return (
        <View>
            <Text style={[label ? inputStyles.label : inputStyles.noLabel, roboto.bodySmallBold,]}>{label}</Text>

            <View style={[inputStyles.inputV, focused ? inputStyles.focusedInputBox : null, invalid && inputStyles.invalidInputBox]}>

            <TextInput
                ref={ref}
                style={[inputStyles.gen, icon && inputStyles.genIcon, roboto.bodyMedium, inputStyles.txtColor]}
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
                secureTextEntry={secureText}
                {...props}
            />

            {
                icon ? <TouchableOpacity onPress={setSecureText}>
                    <Image source={icon} style={inputStyles.icon} />
                </TouchableOpacity> : null
            }

            </View>
        </View>
    )
})

Input.displayName = "Input"
export default Input
