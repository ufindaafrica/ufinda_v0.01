import { images } from "@/constants/images";
import { thumbnailStyles } from "@/styles/componentStyles/thumbnail";
import { ImageBackground, Text, View } from "react-native";


export default function Thumbnail () {
    
    return (
        <ImageBackground style={thumbnailStyles.main}>
            <View style={thumbnailStyles.txtV}>
                <Text style={thumbnailStyles.txt}>Available</Text>
                <Text style={thumbnailStyles.txt}>3.0 mi</Text>
            </View>
        </ImageBackground>
    )
}

// fff6e6
// 593a00