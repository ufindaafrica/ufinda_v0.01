import { images } from "@/constants/images";
import { scale } from "@/deps/scale";
import { Image, View } from "react-native";

type AvatarProps = {
    img: string
}

export default function Avatar ({ img }: AvatarProps) {
    return (
        <View style={{width: scale(44), height: scale(44), borderRadius: 44, backgroundColor: '#8e8e93'}}>
            <Image source={img ? {uri: img} : images.laptop} resizeMode="cover" style={{width: "100%", height: "100%", borderRadius: 44}} />
        </View>
    )
}
