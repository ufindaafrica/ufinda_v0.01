import { selectStyles } from "@/styles/componentStyles/select"
import { roboto } from "@/styles/globals"
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
            style={[selectStyles.box, selected && selectStyles.activeBox, clickable && selectStyles.clickable, icon && selectStyles.boxWithIcon]}>

            {icon ? <Image source={icon} style={[selectStyles.icon]} /> : null}

            <Text style={[selectStyles.text, selected ? selectStyles.activeText : null, roboto.mediumEmphasizedBold]}>{text}</Text>

        </TouchableOpacity>
    )
}

