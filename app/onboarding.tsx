import { images } from "@/constants/images";
import { onboardingStyles } from "@/styles/onboarding";
import { useState, useRef, useEffect } from "react";
import { Image, ImageBackground, Text, TouchableOpacity, View, Pressable, PanResponder, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dimensions } from "react-native";
import { text } from "@/constants/texts";
import { router } from "expo-router";
import { roboto } from "@/styles/globals";

const { width } = Dimensions.get("window");

export default function Onboarding() {

    const [position, setPosition] = useState(0)
    const [img, setImg] = useState(images.on1)
    const fadeAnim = useRef(new Animated.Value(1)).current
    const slideAnim = useRef(new Animated.Value(0)).current
    const direction = useRef(0)

    const headers = text.onheader
    const descs = text.ondesc

    const right = () => {
        if (position < 2) {
            direction.current = 1
            setPosition(position + 1)
        }
    }

    const left = () => {
        if (position > 0) {
            direction.current = -1
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

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: -direction.current * width,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            if (position === 0) setImg(images.on1)
            else if (position === 1) setImg(images.on2)
            else if (position === 2) setImg(images.on3)

            slideAnim.setValue(direction.current * width)

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    }, [position])

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
                    <Image source={images.uFindaText} style={[onboardingStyles.img]}></Image>
                </ImageBackground>

                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
                    <Image source={img} style={[onboardingStyles.onImg, position === 2 && onboardingStyles.onImg3]}></Image>
                </Animated.View>



                <View style={onboardingStyles.bottomV}>
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <Text style={[onboardingStyles.header, roboto.headingSmallBold]}>{headers[position]}</Text>
                        <Text style={[onboardingStyles.regular, roboto.bodyMedium]}>{descs[position]}</Text>
                    </Animated.View>

                    <View style={onboardingStyles.dots}>
                        <Image source={(position == 0) ? images.blackDot : images.dot} style={onboardingStyles.dotImg}></Image>
                        <Image source={(position == 1) ? images.blackDot : images.dot} style={onboardingStyles.dotImg}></Image>
                        <Image source={(position == 2) ? images.blackDot : images.dot} style={onboardingStyles.dotImg}></Image>
                    </View>

                    <TouchableOpacity
                        style={onboardingStyles.button}
                        onPress={() => router.replace("/auth/login")}
                    >
                        <Text style={[onboardingStyles.buttonText, roboto.mediumEmphasizedBold]}>Get Started</Text>
                    </TouchableOpacity>

                </View>
            </Pressable>
        </SafeAreaView>
    )
}

