import { images } from "@/constants/images";
import { onboardingStyles } from "@/styles/onboarding";
import { useState, useRef } from "react";
import { Image, ImageBackground, Text, TouchableOpacity, View, Pressable, PanResponder } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dimensions } from "react-native";
import { text } from "@/constants/texts";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

export default function Onboarding() {

    const [position, setPosition] = useState(0)

    const headers = text.onheader
    const descs = text.ondesc

    const right = () => {
        if (position < 2) {
            setPosition(position + 1)
        }
    }

    const left = () => {
        if (position > 0) {
            setPosition(position - 1)
        }
    }

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20,
            onPanResponderRelease: (_, g) => {
                if (g.dx > 50) left();
                else if (g.dx < -50) right();
            }
        })
    ).current;

    return (
        <SafeAreaView style={onboardingStyles.container}>
            <Pressable
                style={onboardingStyles.pressable}
                onPress={e => {
                    const x = e.nativeEvent.locationX;
                    if (x > width / 2) right();
                    else left();
                }}
                {...panResponder.panHandlers}
            >

                <ImageBackground style={onboardingStyles.logo}>
                    <Image source={images.uFindaText}></Image>
                </ImageBackground>

                <ImageBackground>
                    <Image source={images.on1}></Image>
                </ImageBackground>

                <View style={onboardingStyles.textView}>
                    <Text style={onboardingStyles.header}>{headers[position]}</Text>
                    <Text style={onboardingStyles.regular}>{descs[position]}</Text>
                </View>

                <View style={onboardingStyles.dots}>
                    <Image source={(position == 0) ? images.blackDot : images.dot}></Image>
                    <Image source={(position == 1) ? images.blackDot : images.dot}></Image>
                    <Image source={(position == 2) ? images.blackDot : images.dot}></Image>
                </View>

                <TouchableOpacity
                    style={onboardingStyles.button}
                    onPress={() => router.replace("/auth/mode")}
                >
                    <Text style={onboardingStyles.buttonText}>Get Started</Text>
                </TouchableOpacity>
            </Pressable>
        </SafeAreaView>
    )
}

