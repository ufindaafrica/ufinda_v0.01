import { ProductType } from "@/constants/dummy_shop";
import { images } from "@/constants/images";
import { roboto } from "@/styles/globals";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { Image as ExpoImage } from "expo-image"
import Select from "./select";


interface ProductFlatListType {
    name: string,
    products: Array<ProductType>,
    cartbutton?: boolean
}

export default function ProductFlatList({ name, products, cartbutton }: ProductFlatListType) {

    return (
        <View style={{ marginTop: 16 }}>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={roboto.titleSmallBold}>{name ?? ""}</Text>
                <TouchableOpacity><Text style={[roboto.bodySmall, { color: "#008000" }]}>View All</Text></TouchableOpacity>
            </View>

            <FlatList
                data={products ?? []}
                keyExtractor={(item, idx) => idx.toString()}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 16 }}
                renderItem={({ item, index }) => (
                    <TouchableOpacity key={index} style={{ width: 134, height: cartbutton ? 213 : 173, borderColor: '#e5e5ea', borderWidth: 0.5, borderRadius: 8 }}>

                        <View style={{ width: 133, height: 115, backgroundColor: '#ffe3b0', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>

                            <TouchableOpacity style={{ position: 'absolute', width: 32, height: 32, backgroundColor: '#f5f5f5', top: 0, right: 0, borderBottomLeftRadius: 8, alignItems: 'center', justifyContent: 'center', borderTopRightRadius: 8, zIndex: 10 }}>
                                <Image source={images.inactiveSaved} style={{ width: 18, height: 18 }} />
                            </TouchableOpacity>

                            <ExpoImage source={{ uri: item.image }} contentFit="cover" style={{ width: "100%", height: "100%", borderTopLeftRadius: 8, borderTopRightRadius: 8 }} />

                        </View>

                        <View style={{ width: 133, height: cartbutton ? 98 : 58, position: 'absolute', bottom: 0, backgroundColor: cartbutton ? '#fcfcfc' : '#f5f5f5', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, left: 0, justifyContent: 'flex-end', padding: 8 }}>
                            <Text style={[roboto.bodySmall]}>{item.name}</Text>
                            <Text style={[roboto.bodyMediumBold]}>{`₦ ${(item.price).toLocaleString()}`}</Text>

                            {/* <Text style={[roboto.bodySmall, {textDecorationLine: 'line-through'}]}>{`₦ ${(item.originalPrice).toLocaleString()}`}</Text> */}

                            <View style={{marginTop: 8}}>
                                {
                                    cartbutton ? <Select cartbutton selected text="Add to Cart" /> : null
                                }
                            </View>
                        </View>

                    </TouchableOpacity>
                )} />

        </View>
    )
}

