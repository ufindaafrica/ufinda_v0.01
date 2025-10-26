import { thumbnailStyles } from "@/styles/componentStyles/thumbnail";
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
                <Text style={[thumbnailStyles.txt, !available && thumbnailStyles.unavailable]}>Available</Text>
                <Text style={thumbnailStyles.txt}>{distance} mi</Text>
            </View>
        </ImageBackground>
    )
}

// fff6e6
// 593a00