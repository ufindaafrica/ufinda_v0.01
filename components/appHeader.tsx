import { images } from "@/constants/images";
import { appHeaderStyles } from "@/styles/componentStyles/appHeader";
import { Image, Text, TouchableOpacity, View } from "react-native";

// type AppHeaderProps = {
//     selectedHostel: boolean,
//     selectedShop: boolean
// }

export default function AppHeader() {
    return (
        <View style={appHeaderStyles.main}>
            <TouchableOpacity>
                <Image source={images.menu} style={appHeaderStyles.img} />
            </TouchableOpacity>

            <View style={appHeaderStyles.textV}>
                <TouchableOpacity>
                    <Text style={[appHeaderStyles.text, appHeaderStyles.selectedText]}>Hostel</Text>
                </TouchableOpacity>

                <TouchableOpacity disabled>
                    <Text style={appHeaderStyles.text}>Shop</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity>
                <Image source={images.bell} style={appHeaderStyles.img} />
            </TouchableOpacity>
        </View>
    )
}
