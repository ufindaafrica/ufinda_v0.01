import { scale } from "@/deps/scale";
import { drawerStyles } from "@/styles/componentStyles/drawer";
import { TouchableOpacity, View } from "react-native";

interface RadioButtonProps {
    selected: boolean,
    onSelect: (value: any) => void
}

export default function RadioButton ({ selected, onSelect} : RadioButtonProps) {

    return (
        <TouchableOpacity style={drawerStyles.outerRadioButton} onPress={onSelect}>
            {
                selected ? <View style={drawerStyles.innerRadioButton}></View> : null
            }
        </TouchableOpacity>
    )
}


