import { images } from "@/constants/images";
import { searchStyles } from "@/styles/componentStyles/search";
import { roboto } from "@/styles/globals";
import { useState } from "react";
import { Image, TextInput, View } from "react-native";

type SearchProps = {
    searchHostels?: (text: string, type: "options" | "input" | "search") => void
}

export default function Search({ searchHostels } : SearchProps) {
    const [input, setInput] = useState("")

    return (
        <View style={searchStyles.main}>
            <Image source={images.search0} style={searchStyles.img} />
            <TextInput 
            style={[searchStyles.text, roboto.bodyMedium]}
            value={input}
            onChangeText={(text) => setInput(text)}
            onSubmitEditing={() => searchHostels && searchHostels(input, "search")}
            returnKeyType="search"
            returnKeyLabel="search"/>
        </View>
    )
}
