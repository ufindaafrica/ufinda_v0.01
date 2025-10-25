import { images } from "@/constants/images";
import { filterStyles } from "@/styles/componentStyles/filter";
import { useRef, useState } from "react";
import { Image, Keyboard, Text, TextInput, TouchableOpacity, View } from "react-native";

type FilterProps = {
    options?: Array<string>,
    filterType: "options" | "input",
    text?: string
}

export default function Filter({ options, filterType, text }: FilterProps) {

    const [optionsVisible, setOptionsVisible] = useState(false)
    const [currentOption, setCurrentOption] = useState<string | null>(options?.[0] ?? text ?? null)
    const [enterInput, setEnterInput] = useState(false)
    const [changed, setChanged] = useState(true)

    const [input, setInput] = useState("")

    const onPress = () => {
        if (filterType === "options") setOptionsVisible(!optionsVisible)
        else {
            setEnterInput(!enterInput)
            setTimeout(() => {
                inputRef.current?.focus()
            }, 0);
        }
    }
    
    const inputRef = useRef<TextInput>(null)

    return (
        <TouchableOpacity onPress={onPress}>
            <View style={filterStyles.visibleV}>
                {
                    !enterInput ? <Text style={filterStyles.text}>{currentOption}</Text> :
                        <TextInput
                            ref={inputRef}
                            style={[filterStyles.input, filterStyles.text]}
                            keyboardType="numeric"
                            value={input}
                            onChangeText={(text) => setInput(text)}
                            onBlur={() => {
                                if (input == "") {
                                    setEnterInput(false)
                                }
                            }} />
                }

                {
                    filterType === "options" ? <TouchableOpacity onPress={() => setOptionsVisible(!optionsVisible)}>
                        <Image source={optionsVisible ? images.arrowUp : images.arrowDown} style={filterStyles.img} />
                    </TouchableOpacity> : null
                }
            </View>
            <View style={filterType === "options" ? filterStyles.visibleDropDown : null}>
                {
                    filterType === "options" ? optionsVisible ? options?.map((item, idx) => {
                        return (
                            <TouchableOpacity key={idx} onPress={() => {
                                setCurrentOption(item)
                                setOptionsVisible(false)
                            }}>
                                <Text style={filterStyles.text}>{item}</Text>
                            </TouchableOpacity>
                        )
                    }) : null
                        : null
                }
            </View>
        </TouchableOpacity>
    )
}
