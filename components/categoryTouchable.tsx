import { globals, roboto } from "@/styles/globals"
import { Image } from "expo-image"
import { Text, TouchableOpacity } from "react-native"


interface CategoryTouchableType {
    name: string,
    img: string
}

export default function CategoryTouchable ({ name, img }: CategoryTouchableType) {

    return (
        <TouchableOpacity style={{width: 84, height: 99, borderRadius: 8, flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
            <Image source={{uri: img}} contentFit="cover" style={{width: 84, height: 83, borderRadius: 8, backgroundColor: "#d9d9d9"}} />
            <Text style={[roboto.caption]}>{name}</Text>
        </TouchableOpacity>
    )
}

