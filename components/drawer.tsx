import { images } from "@/constants/images";
import { moderateScale, scale, verticalScale } from "@/deps/scale";
import { roboto } from "@/styles/globals";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from "react-native-reanimated";
import RadioButton from "./radioButton";
import { useEffect, useState } from "react";
import { scheduleOnRN } from "react-native-worklets";
import { drawerStyles } from "@/styles/componentStyles/drawer";

interface DrawerProps {
    title: string,
    options: string[],
    onSelectOption: (value: any) => void,
    onCloseDrawer: (value: any) => void,
    selectedOption: string
}

export default function Drawer({ title, options, onSelectOption, onCloseDrawer, selectedOption }: DrawerProps) {

    const height = Dimensions.get("window").height

    const modalHeight = 160 + ((options?.length ?? 0) * 40)

    const translateY = useSharedValue(height)

    const openDrawer = () => {
        translateY.value = withTiming(0, { duration: 500 })
    }

    const closeDrawer = () => {
        translateY.value = withTiming(height, { duration: 500 }, (finished) => {
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
        }, 1000)
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
                        options?.map((item, idx) => <View key={idx} style={drawerStyles.optionsRow}>
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
