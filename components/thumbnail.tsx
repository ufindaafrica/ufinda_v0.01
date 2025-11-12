import { thumbnailStyles } from "@/styles/componentStyles/thumbnail";
import { roboto } from "@/styles/globals";
import { ImageBackground, Text, View } from "react-native";


type ThumbnailProps = {
    bg: any,
    available: boolean,
    distance: number
}

export default function Thumbnail ({ bg, available, distance }: ThumbnailProps) {
    
    return (
        <ImageBackground source={bg} imageStyle={thumbnailStyles.bgStyle} style={thumbnailStyles.main} >
            <View style={thumbnailStyles.txtV}>
                <Text style={[thumbnailStyles.txt, !available && thumbnailStyles.unavailable, roboto.caption]}>Available</Text>
                <Text style={[thumbnailStyles.txt, roboto.caption]}>{distance} mi</Text>
            </View>
        </ImageBackground>
    )
}

// fff6e6
// 593a00