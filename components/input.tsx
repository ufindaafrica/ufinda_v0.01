import { inputStyles } from "@/styles/componentStyles/input";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

type inputProps = {
    label: string,
    hint?: string,

}


export default function Input({ label, hint }: inputProps) {

    const [ focused, setFocused ] = useState(false)

    return (
        <View>
            <Text style={inputStyles.label}>{label}</Text>
            
            <TextInput
                style={[inputStyles.gen, inputStyles.inputBox, focused ? inputStyles.focusedInputBox : null]}
                placeholder={hint}
                onChange={() => {
                    setFocused(true)
                }}
                numberOfLines={1}
            />
        </View>
    )
}
