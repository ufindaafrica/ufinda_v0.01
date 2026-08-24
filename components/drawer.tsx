import { images } from "@/constants/images";
import { verticalScale } from "@/deps/scale";
import { drawerStyles } from "@/styles/componentStyles/drawer";
import { roboto } from "@/styles/globals";
import { useEffect, useState } from "react";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import RadioButton from "./radioButton";

interface DrawerProps {
    title: string,
    options: string[],
    onSelectOption: (value: any) => void,
    onCloseDrawer: (value: any) => void,
    selectedOption: string,
    optionless?: boolean,
}

export default function Drawer({ title, options, onSelectOption, onCloseDrawer, selectedOption, optionless }: DrawerProps) {

    const height = Dimensions.get("screen").height

    const modalHeight = 160 + ((options?.length ?? 0) * 40)

    const translateY = useSharedValue(height)

    const openDrawer = () => {
        translateY.value = withTiming(0, { duration: 200 })
    }

    const closeDrawer = () => {
        translateY.value = withTiming(height, { duration: 200 }, (finished) => {
            if (finished) {
                scheduleOnRN(onCloseDrawer, false)
            }
        })
    }

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }]
    }))

    useEffect(() => {
        openDrawer()
    }, [])

    const [button, setButton] = useState(selectedOption)

    const select = (item: string) => {
        setTimeout(() => {
            onSelectOption(item)
            closeDrawer()
        }, 500)
    }

    return (
        <View style={[drawerStyles.main, { height: height }]}>
            <Animated.View style={[{ height: verticalScale(modalHeight)}, drawerStyles.animated, animStyle]}>
                <TouchableOpacity onPress={() => closeDrawer()}>
                    <Image source={images.close} style={drawerStyles.img} />
                </TouchableOpacity>
                <Text style={[roboto.titleMediumBold, drawerStyles.titleTxt]}>{title}</Text>
                <View style={drawerStyles.drawerPadding}>
                    {
                        options?.map((item, idx) => optionless ? <View key={idx} style={drawerStyles.optionsRow}>
                            <TouchableOpacity style={{width: "100%", height: "100%",justifyContent: "center", alignItems: "center"}} onPress={() => select(item)}>
                                <Text style={[roboto.titleSmall, {textAlign: "center"}]}>{item}</Text>
                            </TouchableOpacity>
                        </View> : <View key={idx} style={drawerStyles.optionsRow}>
                            <Text style={roboto.titleSmall}>{item}</Text>
                            <TouchableOpacity onPress={() => {() => {setButton(item); select(item)}}}>
                                <RadioButton selected={item === button ? true : false} onSelect={() => {setButton(item), select(item)}}/>
                            </TouchableOpacity>
                        </View>)
                    }
                </View>
            </Animated.View>
        </View>
    )
}
