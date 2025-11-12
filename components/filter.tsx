import { images } from "@/constants/images";
import { filterStyles } from "@/styles/componentStyles/filter";
import { roboto } from "@/styles/globals";
import { useEffect, useRef, useState } from "react";
import { Image, Keyboard, Text, TextInput, TouchableOpacity, View } from "react-native";

type FilterProps = {
    options?: Array<string>,
    filterType: "options" | "input",
    text?: string,
    visible?: boolean,
    setVisible?: (value: any) => void,
    onInputFocus?: (value: any) => void,
    setCurrentFilter: (text: string, type: "options" | "input" | "search") => void,
    active?: boolean
}

export default function Filter({ options, filterType, text, visible, setVisible, onInputFocus, setCurrentFilter, active }: FilterProps) {

    // const [optionsVisible, setOptionsVisible] = useState(visible)
    const [currentOption, setCurrentOption] = useState<string | null>(options?.[0] ?? text ?? null)
    const [enterInput, setEnterInput] = useState(false)
    const [changed, setChanged] = useState(active ? true : false)

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
            <View style={[filterStyles.visibleV, changed && filterStyles.activeV]}>
                {
                    !enterInput ? <Text style={[filterStyles.text, roboto.mediumEmphasized, changed && filterStyles.activeFilterText]}>{currentOption}</Text> :
                        <TextInput
                            ref={inputRef}
                            style={[filterStyles.input, filterStyles.text, roboto.mediumEmphasized, changed && filterStyles.activeFilterText]}
                            keyboardType="numeric"
                            value={input}
                            onChangeText={(text) => setInput(text)}
                            onBlur={() => {
                                if (input == "") {
                                    setEnterInput(false)
                                    setChanged(false)
                                }
                                if (input != "") {
                                    const preText = text ? text + ": " : ""
                                    setCurrentFilter(preText + input, "input")
                                    setChanged(true)
                                }
                            }}
                            onFocus={onInputFocus} />
                }

                {
                    filterType === "options" ? <TouchableOpacity onPress={() => {
                        setVisible ? setVisible(!visible) : null
                        Keyboard.dismiss()
                        }}>
                        <Image source={visible ? images.arrowUp : images.arrowDown} style={[filterStyles.img, changed && filterStyles.activeImg]} />
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
                                setChanged(true)
                                if (item === "Type") {
                                    setChanged(false)
                                    setCurrentFilter("Near You", "options")
                                }
                            }}>
                                <Text style={[filterStyles.text, roboto.mediumEmphasized]}>{item}</Text>
                            </TouchableOpacity>
                        )
                    }) : null
                        : null
                }
            </View>
        </TouchableOpacity>
    )
}
