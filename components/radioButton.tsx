import { scale } from "@/deps/scale";
import { TouchableOpacity, View } from "react-native";

interface RadioButtonProps {
    selected: boolean,
    onSelect: (value: any) => void
}

export default function RadioButton ({ selected, onSelect} : RadioButtonProps) {

    return (
        <TouchableOpacity style={{height: scale(24), width: scale(24), borderRadius: 50, borderWidth: 1.5, borderColor: "#546881", justifyContent: 'center', alignItems: 'center'}} onPress={onSelect}>
            {
                selected ? <View style={{height: scale(18), width: scale(18), borderRadius: 50, backgroundColor: "#546881"}}></View> : null
            }
        </TouchableOpacity>
    )
}


