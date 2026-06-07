import AppHeader from "@/components/appHeader";
import CategoryTouchable from "@/components/categoryTouchable";
import ProductFlatList from "@/components/productFlatList";
import Search from "@/components/search";
import { dummy_shop } from "@/constants/dummy_shop";
import { images } from "@/constants/images";
import { globals } from "@/styles/globals";
import { homeStyles } from "@/styles/home";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";


export default function Shop() {

    return (
        <SafeAreaProvider>
            <SafeAreaView style={globals.homeContainer}>
                <View style={homeStyles.layoutMargin}>
                    <AppHeader shop />
                </View>
                {/* <View style={{ justifyContent: "center", height: "85%", width: "100%", alignItems: "center" }}>
                    <Image source={images.comingSoon} style={{ width: 243, height: 243 }} />
                </View> */}

                <View style={[homeStyles.layoutMargin, { flexDirection: 'row', justifyContent: 'space-between', alignContent: 'center' }]}>
                    <View style={{ width: "85%" }}>
                        <Search />
                    </View>
                    <TouchableOpacity style={{ width: 44, height: 44, backgroundColor: "#ffffff", borderRadius: 30, justifyContent: 'center', alignItems: 'center' }}>
                        <Image source={images.sort} style={{ width: 24, height: 24 }} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 150}}>

                    {/* category list view */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                        {
                            dummy_shop.categories.map((item, idx) => <CategoryTouchable catId={item.id} name={item.name} img={`https://picsum.photos/100/100?random=${idx}`} key={idx} />)
                        }
                    </View>

                    {/* best deals */}
                    <ProductFlatList name="Best Deals" products={(dummy_shop.products).filter((product) => product.discountRate > 56)} />

                    {/* best laptop deals */}
                    <ProductFlatList name="Top Laptop Deals" products={(dummy_shop.products).filter((product) => product.category === "laptops" && product.discountRate > 40)} />

                    {/* recommended */}
                    <ProductFlatList name="Recommended" products={(dummy_shop.products).filter((product) => product.isFeatured && product.sellerRating > 4.5)} />

                </ScrollView>

            </SafeAreaView>
        </SafeAreaProvider>
    )
}
