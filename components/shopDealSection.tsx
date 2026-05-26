import { ShopProduct } from "@/constants/shopData";
import ShopProductCard from "@/components/shopProductCard";
import { shopStyles } from "@/styles/shop";
import { colors, roboto } from "@/styles/globals";
import { toast } from "@/deps/toast";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

type ShopDealSectionProps = {
    title: string;
    products: ShopProduct[];
};

export default function ShopDealSection({ title, products }: ShopDealSectionProps) {
    return (
        <View style={shopStyles.layoutMargin}>
            <View style={shopStyles.sectionHeader}>
                <Text style={[shopStyles.sectionTitle, roboto.bodyLargeBold]}>
                    {title}
                </Text>
                <TouchableOpacity onPress={() => toast("View all coming soon")}>
                    <Text style={[shopStyles.viewAll, roboto.bodyMediumBold, colors.foundationWarningDark]}>
                        View All
                    </Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={shopStyles.dealsList}
                renderItem={({ item }) => <ShopProductCard product={item} />}
            />
        </View>
    );
}
