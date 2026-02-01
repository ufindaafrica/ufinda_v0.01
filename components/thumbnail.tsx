import { thumbnailStyles } from "@/styles/componentStyles/thumbnail";
import { roboto } from "@/styles/globals";
import { ImageBackground, Text, View } from "react-native";
import { Image } from "expo-image"
import { moderateScale } from "@/deps/scale";


type ThumbnailProps = {
    bg: any,
    available: boolean,
    distance: number
}

export default function Thumbnail({ bg, available, distance }: ThumbnailProps) {

    return (
        <View>
            <Image
                source={bg}
                style={[thumbnailStyles.main, thumbnailStyles.bgStyle]}
                cachePolicy="disk"
                contentFit="cover" >
            </Image>

            <View style={thumbnailStyles.txtV}>
                <Text style={[thumbnailStyles.txt, !available && thumbnailStyles.unavailable, roboto.caption]}>Available</Text>
                <Text style={[thumbnailStyles.txt, roboto.caption]}>{distance} mi</Text>
            </View>
        </View>
    )
}

// fff6e6
// 593a00