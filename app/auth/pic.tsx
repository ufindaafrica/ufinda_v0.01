import BackArrow from "@/components/back";
import Select from "@/components/select";
import { globals } from "@/styles/globals";
import { picStyles } from "@/styles/pic";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker"


export default function Pic() {

    const [desc, setDesc] = useState("")
    const [descLength, setDescLength] = useState(0)

    const onEnterDesc = (text: string) => {
        setDesc(text)
        setDescLength(text.length)
    }

    const [image, setImage] = useState("")
    const [imageName, setImageName] = useState<any>(null)
    const [imageType, setImageType] = useState("")

    const pickImage = async () => {
        const selectedImage = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            aspect: [4, 4],
            quality: 1
        })

        if (!selectedImage.canceled) {
            setImage(selectedImage.assets[0].uri)
            setImageName(selectedImage.assets[0].fileName)
            setImageType("image/" + selectedImage.assets[0].fileName?.split(".").pop()?.toLowerCase())
        }
    }

    return (
        <SafeAreaView style={[globals.container, globals.authContainer]}>

            <BackArrow backFun={() => router.replace("/(tabs)/home")} />

            <View style={picStyles.main}>
                <Text style={picStyles.headerText}>One more step</Text>
                <Text style={picStyles.pText}>Now let's communicate your presence, please update your profile.</Text>
            </View>

            <View style={[picStyles.main, picStyles.imgV]}>
                <TouchableOpacity style={picStyles.imgO} onPress={() => pickImage()}>
                    {
                        image ? <Image source={{ uri: image }} style={picStyles.previewImage} />
                            :
                            <Text style={picStyles.fileText}>Browse files</Text>
                    }
                </TouchableOpacity>
            </View>

            <View style={[picStyles.main]}>
                <View style={picStyles.descHeader}>
                    <Text style={picStyles.descText}>Description</Text>
                    <Text style={picStyles.descText}>{descLength.toString()}/20</Text>
                </View>
                <TextInput
                    placeholder="Tell us about yourself"
                    placeholderTextColor={"#b3b3b3"}
                    style={picStyles.descInput}
                    maxLength={20}
                    value={desc}
                    onChangeText={(text) => onEnterDesc(text)}
                />
            </View>

            <View style={picStyles.main}>
                <Select text="Continue" selected clickable={image || desc ? false : true} selectFun={() => router.replace("/auth/finishReg")} />
            </View>

            <Link href={"/(tabs)/home"} style={[picStyles.main, picStyles.linkText]}>
                I'll do this later
            </Link>

        </SafeAreaView>
    )
}
