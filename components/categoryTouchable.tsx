import { roboto } from "@/styles/globals"
import { Image } from "expo-image"
import { router } from "expo-router"
import { Text, TouchableOpacity } from "react-native"


interface CategoryTouchableType {
    name: string,
    img: string,
    catId: string,
    subCat?:boolean
}

export default function CategoryTouchable ({ name, img, catId, subCat }: CategoryTouchableType) {

    return (
        <TouchableOpacity onPress={() => { router.push({
            pathname: "/shop/category-page",
            params: {
                id: String(catId),
                name: String(name),
                ...(subCat && {subCat: String("true")})
            }
        }) }} style={{width: 84, height: 99, borderRadius: 8, flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
            <Image source={{uri: img}} contentFit="cover" style={{width: 84, height: 83, borderRadius: 8, backgroundColor: "#d9d9d9"}} />
            <Text style={[roboto.caption]}>{name}</Text>
        </TouchableOpacity>
    )
}

