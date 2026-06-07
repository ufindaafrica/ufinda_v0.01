import AppHeader from "@/components/appHeader";
import BackArrow from "@/components/back";
import CategoryTouchable from "@/components/categoryTouchable";
import LineBreak from "@/components/lineBreak";
import ProductFlatList from "@/components/productFlatList";
import { dummy_shop } from "@/constants/dummy_shop";
import { images } from "@/constants/images";
import { globals, roboto } from "@/styles/globals";
import { idStyles } from "@/styles/id";
import { router, useLocalSearchParams } from "expo-router";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";


export default function SingleCategoryPage() {

    const { id, name, subCat } = useLocalSearchParams()
    const catId = Array.isArray(id) ? id[0] : id
    const catName = Array.isArray(name) ? name[0] : name
    const subCatString = Array.isArray(subCat) ? subCat[0] : subCat

    const productNames = dummy_shop.products.filter((product) => subCatString ? product.name.includes(catName) : product.category == catId).map(product => (product.name).split(" ")[0])

    const productNamesUniqueList = [...(new Set(productNames))]

    return (
        <SafeAreaProvider>
            <SafeAreaView style={globals.lightContainer}>
                <View style={idStyles.headerV}>
                    <View style={idStyles.firstHeaderV}>
                        <BackArrow backFun={() => router.back()} large />
                        <Text style={roboto.titleLargeBold}>{catName ?? ""}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <Image source={images.search0} style={idStyles.moreImg} />
                        <Image source={images.more} style={idStyles.moreImg} />
                    </View>
                </View>

                <LineBreak />

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>

                    <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                        <ProductFlatList name="Top Picks" products={(dummy_shop.products).filter((product) => subCatString ? product.name.includes(catName) && (product.category == catId) : (product.category == catId) && (Number(product.discountRate) > 40))} cartbutton />
                    </View>

                    { subCatString ? null : <LineBreak />}

                    {/* category list view */}
                    {
                    subCatString ? null : <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
                        {
                            productNamesUniqueList.map((item, idx) => <CategoryTouchable catId={catId} name={item} subCat img={`https://picsum.photos/100/100?random=${idx + 26}`} key={idx} />)
                        }
                    </View>
                    }

                    {
                        productNamesUniqueList.map((item, idx) => (
                            <View key={idx}>
                                <LineBreak />

                                <View style={{paddingHorizontal: 16, paddingBottom: 16}}>
                                    <ProductFlatList cartbutton name={`${item} Official Store`} products={(dummy_shop.products).filter((product) => (product.category == catId) && (product.name.includes(item)))} />
                                </View>
                            </View>
                        ))
                    }

                </ScrollView>



            </SafeAreaView>
        </SafeAreaProvider>
    )
}

