import { images } from "@/constants/images";
import { shopStyles } from "@/styles/shop";
import { roboto } from "@/styles/globals";
import { useState } from "react";
import { Image, TextInput, TouchableOpacity, View } from "react-native";
import { toast } from "@/deps/toast";

export default function ShopSearchRow() {
    const [query, setQuery] = useState("");

    return (
        <View style={shopStyles.searchRow}>
            <View style={shopStyles.searchInputWrap}>
                <Image source={images.search0} style={shopStyles.searchIcon} />
                <TextInput
                    style={[shopStyles.searchInput, roboto.bodyMedium]}
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search"
                    placeholderTextColor="#8e8e93"
                    returnKeyType="search"
                />
            </View>
            <TouchableOpacity
                style={shopStyles.filterButton}
                onPress={() => toast("Filters coming soon")}
                accessibilityLabel="Filter products"
            >
                <View style={shopStyles.filterBar} />
                <View style={shopStyles.filterBar} />
                <View style={shopStyles.filterBar} />
            </TouchableOpacity>
        </View>
    );
}
