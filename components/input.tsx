import { inputStyles } from "@/styles/componentStyles/input";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

type inputProps = {
    label: string,
    hint?: string,
    onFocus?: (value: any) => void
}


export default function Input({ label, hint, onFocus }: inputProps) {

    const [ focused, setFocused ] = useState(false)

    return (
        <View>
            <Text style={inputStyles.label}>{label}</Text>
            
            <TextInput
                style={[inputStyles.gen, inputStyles.inputBox, focused ? inputStyles.focusedInputBox : null]}
                placeholder={hint}
                placeholderTextColor={"#c7c7cc"}
                onChange={() => {
                    setFocused(true)
                }}
                numberOfLines={1}
                onFocus={onFocus}
            />
        </View>
    )
}
