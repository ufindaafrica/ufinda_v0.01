import AppHeader from "@/components/appHeader";
import ShopCategoryGrid from "@/components/shopCategoryGrid";
import ShopDealSection from "@/components/shopDealSection";
import ShopSearchRow from "@/components/shopSearchRow";
import { BEST_DEALS, TOP_LAPTOP_DEALS } from "@/constants/shopData";
import { globals } from "@/styles/globals";
import { homeStyles } from "@/styles/home";
import { shopStyles } from "@/styles/shop";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Shop() {
    return (
        <SafeAreaView style={globals.homeContainer}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={shopStyles.scrollContent}
            >
                <View style={homeStyles.layoutMargin}>
                    <AppHeader shop />
                </View>

                <View style={homeStyles.layoutMargin}>
                    <ShopSearchRow />
                </View>

                <View style={homeStyles.layoutMargin}>
                    <ShopCategoryGrid />
                </View>

                <ShopDealSection title="Best Deals" products={BEST_DEALS} />
                <ShopDealSection title="Top Laptop Deals" products={TOP_LAPTOP_DEALS} />
            </ScrollView>
        </SafeAreaView>
    );
}
