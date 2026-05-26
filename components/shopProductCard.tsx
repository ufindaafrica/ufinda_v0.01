import { formatNaira, ShopProduct } from "@/constants/shopData";
import { images } from "@/constants/images";
import { shopProductCardStyles } from "@/styles/componentStyles/shopProductCard";
import { colors, roboto } from "@/styles/globals";
import { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

type ShopProductCardProps = {
    product: ShopProduct;
};

export default function ShopProductCard({ product }: ShopProductCardProps) {
    const [saved, setSaved] = useState(false);

    return (
        <View style={shopProductCardStyles.card}>
            <View style={shopProductCardStyles.imageWrap}>
                <TouchableOpacity
                    style={shopProductCardStyles.saveButton}
                    onPress={() => setSaved((prev) => !prev)}
                >
                    <Image
                        source={saved ? images.redsave : images.archiveAdd}
                        style={shopProductCardStyles.saveIcon}
                    />
                </TouchableOpacity>
            </View>
            <Text
                style={[shopProductCardStyles.title, roboto.bodyMediumBold]}
                numberOfLines={2}
            >
                {product.title}
            </Text>
            <Text style={[shopProductCardStyles.price, roboto.bodyMediumBold, colors.black]}>
                {formatNaira(product.price)}
            </Text>
        </View>
    );
}
