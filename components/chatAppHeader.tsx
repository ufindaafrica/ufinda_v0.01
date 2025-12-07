import { images } from "@/constants/images";
import { Image, TouchableOpacity, View } from "react-native";
import Search from "./search";
import { chatAppHeaderStyles } from "@/styles/componentStyles/chatAppHeader";


export default function ChatAppHeader() {

    return (
        <View style={chatAppHeaderStyles.main}>
            <TouchableOpacity style={chatAppHeaderStyles.imgV}>
                <Image source={images.menu} style={chatAppHeaderStyles.img} />
            </TouchableOpacity>

            <View style={chatAppHeaderStyles.searchV}>
                <Search />
            </View>

            <TouchableOpacity style={chatAppHeaderStyles.imgV}>
                <Image source={images.bell} style={chatAppHeaderStyles.img} />
            </TouchableOpacity>
        </View>
    )
}
