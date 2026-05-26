import { SHOP_CATEGORIES } from "@/constants/shopData";
import { shopStyles } from "@/styles/shop";
import { roboto } from "@/styles/globals";
import { toast } from "@/deps/toast";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function ShopCategoryGrid() {
    return (
        <View style={shopStyles.categoryGrid}>
            {SHOP_CATEGORIES.map((category) => (
                <TouchableOpacity
                    key={category.id}
                    style={shopStyles.categoryItem}
                    onPress={() => toast(`${category.label} coming soon`)}
                >
                    <View style={shopStyles.categoryIcon}>
                        {category.icon ? (
                            <Image
                                source={category.icon}
                                style={shopStyles.categoryIconImage}
                            />
                        ) : null}
                    </View>
                    <Text
                        style={[shopStyles.categoryLabel, roboto.caption]}
                        numberOfLines={2}
                    >
                        {category.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}
