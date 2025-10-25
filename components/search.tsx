import { images } from "@/constants/images";
import { searchStyles } from "@/styles/componentStyles/search";
import { Image, TextInput, View } from "react-native";


export default function Search() {
    return (
        <View style={searchStyles.main}>
            <Image source={images.search0} style={searchStyles.img} />
            <TextInput 
            style={searchStyles.text}/>
        </View>
    )
}
