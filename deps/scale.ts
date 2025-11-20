import { Dimensions } from "react-native"

const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT
} = Dimensions.get("window")

const figmaBaseWidth = 390
const figmaBaseHeight = 844

export const scale = (size: number) : number => (SCREEN_WIDTH / figmaBaseWidth) * size

export const verticalScale = (size: number) : number => (SCREEN_HEIGHT / figmaBaseHeight) * size

export const moderateScale = (size: number, factor : number = 0.5) : number => size + (scale(size) - size) * factor
