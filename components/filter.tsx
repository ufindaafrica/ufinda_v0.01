import { images } from "@/constants/images";
import { filterStyles } from "@/styles/componentStyles/filter";
import { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

type FilterProps = {
    options: Array<string>
}

export default function Filter({ options }: FilterProps) {

    const [optionsVisible, setOptionsVisible] = useState(true)
    const [currentOption, setCurrentOption] = useState<string | null>(options[0])
    // const [currentArrow, setCurrentArrow] = useState(images.arrowDown)

    return (
        <TouchableOpacity onPress={() => setOptionsVisible(!optionsVisible)}>
            <View style={filterStyles.visibleV}>
                <Text style={filterStyles.text}>{currentOption}</Text>
                <TouchableOpacity onPress={() => setOptionsVisible(!optionsVisible)}>
                    <Image source={optionsVisible ? images.arrowUp : images.arrowDown} style={filterStyles.img} />
                </TouchableOpacity>
            </View>
            <View style={filterStyles.visibleDropDown}>
                {
                    optionsVisible ? options.map((item, idx) => {
                        return (
                            <TouchableOpacity key={idx}>
                                <Text style={filterStyles.text}>{item}</Text>
                            </TouchableOpacity>
                        )
                    }) : null
                }
            </View>
        </TouchableOpacity>
    )
}
