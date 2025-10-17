import { Text, TextInput, View } from "react-native";

type inputProps = {
    label: string,
    hint?: string,

}


export default function Input({ label, hint } : inputProps) {

    return (
        <View>
            <Text>{label}</Text>
            <TextInput />
        </View>
    )
}
