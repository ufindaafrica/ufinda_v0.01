import { images } from "@/constants/images";
import { colors, roboto } from "@/styles/globals";
import { singleChatStyles } from "@/styles/singleChat";
import { Image, Text, TouchableOpacity, View } from "react-native";

type SettingProps = {
    setting: string,
    value?: string,
    icon?: boolean,
    settingFun?: (value: any) => void,
    kyc?: boolean
}

export default function Setting({ setting, value, icon, settingFun, kyc }: SettingProps) {

    return (
        <View style={[singleChatStyles.row, singleChatStyles.jCenter, singleChatStyles.settings]}>
            <Text style={[roboto.bodyMedium, kyc ? colors.darkBurntOrange : colors.black]}>{setting}</Text>
            <TouchableOpacity onPress={settingFun} style={[singleChatStyles.row, singleChatStyles.gap]}>
                {
                    value && <Text style={[roboto.caption, colors.grays]}>{value}</Text>
                }
                {
                    icon && <Image source={kyc ? images.settingArrowOrange : images.settingArrowBlack} style={singleChatStyles.smallImg} />
                }
            </TouchableOpacity>
        </View>
    )
}
