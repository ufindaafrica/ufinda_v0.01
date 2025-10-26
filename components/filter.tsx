import { images } from "@/constants/images";
import { filterStyles } from "@/styles/componentStyles/filter";
import { useEffect, useRef, useState } from "react";
import { Image, Keyboard, Text, TextInput, TouchableOpacity, View } from "react-native";

type FilterProps = {
    options?: Array<string>,
    filterType: "options" | "input",
    text?: string,
    visible?: boolean,
    setVisible?: (value: any) => void,
    onInputFocus?: (value: any) => void,
    setCurrentFilter: (text: string, type: "options" | "input" | "search") => void
}

export default function Filter({ options, filterType, text, visible, setVisible, onInputFocus, setCurrentFilter }: FilterProps) {

    // const [optionsVisible, setOptionsVisible] = useState(visible)
    const [currentOption, setCurrentOption] = useState<string | null>(options?.[0] ?? text ?? null)
    const [enterInput, setEnterInput] = useState(false)
    const [changed, setChanged] = useState(true)

    const [input, setInput] = useState("")

    const onPress = () => {
        if (filterType === "options") {
            setVisible ? setVisible(!visible) : null
        }
        else {
            setEnterInput(!enterInput)
            setTimeout(() => {
                inputRef.current?.focus()
            }, 0);
        }
        Keyboard.dismiss()
    }
    
    const inputRef = useRef<TextInput>(null)

    useEffect(() => {
        const hideKeys = Keyboard.addListener("keyboardDidHide", () => {
            inputRef.current?.blur()
        })

        return () => hideKeys.remove()
    }, [inputRef])

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
                                if (input != "") {
                                    const preText = text ? text + ": " : ""
                                    setCurrentFilter(preText + input, "input")
                                }
                            }}
                            onFocus={onInputFocus} />
                }

                {
                    filterType === "options" ? <TouchableOpacity onPress={() => {
                        setVisible ? setVisible(!visible) : null
                        Keyboard.dismiss()
                        }}>
                        <Image source={visible ? images.arrowUp : images.arrowDown} style={filterStyles.img} />
                    </TouchableOpacity> : null
                }
            </View>
            <View style={filterType === "options" ? filterStyles.visibleDropDown : null}>
                {
                    filterType === "options" ? visible ? options?.map((item, idx) => {
                        return (
                            <TouchableOpacity key={idx} onPress={() => {
                                setCurrentOption(item)
                                setVisible? setVisible(false) : null
                                setCurrentFilter(item, "options")
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
