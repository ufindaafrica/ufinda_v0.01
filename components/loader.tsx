import { images } from "@/constants/images";
import { loaderStyles } from "@/styles/componentStyles/loader";
import { Image, View } from "react-native";


export default function Loader() {

    return (
        <View style={loaderStyles.main}>
            <View style={loaderStyles.loaderV}>
                <Image source={images.loader} style={loaderStyles.loader} />
            </View>
        </View>
    )
}
