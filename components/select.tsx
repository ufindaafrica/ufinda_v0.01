import { selectStyles } from "@/styles/componentStyles/select"
import { Image, Text, TouchableOpacity } from "react-native"

type selectProps = {
    text: string,
    icon?: any,
    selected: boolean,
    selectFun?: (value: any) => void,
    clickable?: boolean
}

export default function Select({ text, icon, selected, selectFun, clickable }: selectProps) {

    return (

        <TouchableOpacity
            onPress={selectFun}
            disabled={clickable}
            style={[selectStyles.box, selected && selectStyles.activeBox, clickable && selectStyles.clickable]}>

            <Image source={icon} />

            <Text style={[selectStyles.text, selected ? selectStyles.activeText : null]}>{text}</Text>

        </TouchableOpacity>
    )
}

