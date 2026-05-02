import { images } from "@/constants/images";
import { appHeaderStyles } from "@/styles/componentStyles/appHeader";
import { Image, TouchableOpacity, View } from "react-native";


export default function ChatHeader() {
    return (
        <View style={appHeaderStyles.main}>
            <TouchableOpacity>
                <Image source={images.menu} style={appHeaderStyles.img} />
            </TouchableOpacity>

            <TouchableOpacity>
                <Image source={images.bell} style={appHeaderStyles.img} />
            </TouchableOpacity>
        </View>
    )
}
