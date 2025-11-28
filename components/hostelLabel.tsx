import { images } from "@/constants/images";
import { scale } from "@/deps/scale";
import { roboto } from "@/styles/globals";
import { Image, Text, View } from "react-native";


type HostelLabelProps = {
    label: string
}

export default function HostelLabel({ label }: HostelLabelProps) {
    return (
        <View style={{flexDirection: "row", padding: scale(4)}}>
            <Text style={roboto.bodyMediumBold}>{label}</Text>
            <Image style={{width: 7, height: 7}} source={images.asterisk} />
        </View>
    )
}
