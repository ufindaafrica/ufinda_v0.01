import { scale } from "@/deps/scale";
import { circleProgressStyles, otherStyles } from "@/styles/componentStyles/circleProgress";
import { roboto } from "@/styles/globals";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg"


type CircleProgressProps = {
    progress: number,
    totalProgress: number
}

export default function CircleProgress ({ progress, totalProgress }: CircleProgressProps) {

    const [ strokeDashOffset, setStrokeDashOffset ] = useState(0)

    const radius = Math.round(scale(40))
    const strokeWidth = Math.round(scale(5))
    const r = radius - strokeWidth / 2
    const circumference = 2 * Math.PI * r
    const [ actualProgress, setActualProgress ] = useState(progress / totalProgress)

    useEffect(() => {
        const progressValue = progress / totalProgress
        setActualProgress(progressValue)
    }, [progress])

    useEffect(() => {
        const strokeValue = circumference * (1 - actualProgress)
        setStrokeDashOffset(strokeValue)
    }, [actualProgress])

    
    return (
        <View style={circleProgressStyles.main}>
            <Svg 
                width={radius * 2}
                height={radius * 2}>
                    <Circle 
                        stroke={otherStyles.circle.stroke}
                        fill={otherStyles.circle.fill}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={strokeDashOffset}
                        cx={radius}
                        cy={radius}
                        r={r}
                        strokeLinecap="round"/>

                        <View style={circleProgressStyles.txtView}>
                            <Text style={[roboto.titleLargeBold, circleProgressStyles.color]}>{progress}</Text>
                            <Text style={[roboto.caption, circleProgressStyles.bottomT]}>{`/${totalProgress}`}</Text>
                        </View>

                </Svg>
        </View>
    )
}
