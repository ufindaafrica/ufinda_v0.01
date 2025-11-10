import BackArrow from "@/components/back";
import Select from "@/components/select";
import { globals, roboto } from "@/styles/globals";
import { picStyles } from "@/styles/pic";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker"
import { studentKyc } from "@/services/studentKyc";
import Loader from "@/components/loader";
import ErrorModal from "@/components/errorModal";


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

    const onContinue = async () => {

        const form = new FormData()

        const picData = {
            uri: image,
            name: imageName,
            type: imageType
        }

        form.append("profile_pic", picData as any)

        if (desc != "") form.append("about_me", desc)

        setLoaderVisible(true)

        const result = await studentKyc(form)

        setLoaderVisible(false)

        if (result[0] != "200") {
            seterrorModal(true)
            setErrorText(result[1])
        }
        else {
            setCorrectModal(true)
            setCorrectText(result[1])
        }
    }

    const [loaderVisible, setLoaderVisible] = useState(false)
    const [errorModal, seterrorModal] = useState(true)
    const [errorText, setErrorText] = useState("")
    const [correctModal, setCorrectModal] = useState(false)
    const [correctText, setCorrectText] = useState("")

    useEffect(() => {
        if (errorText != "") {
            seterrorModal(true)
        } else {
            seterrorModal(false)
        }
    }, [errorText])

    useEffect(() => {
        if (correctText != "") {
            setCorrectModal(true)
        } else {
            setCorrectModal(false)
        }
    }, [correctText])

    return (
        <SafeAreaView style={[globals.container]}>

            <View style={picStyles.padding}>
                <BackArrow backFun={() => router.replace("/(tabs)/home")} />
            </View>

            <View style={[picStyles.paddingHorizontal]}>
                <Text style={roboto.titleMediumBold}>One more step</Text>
                <Text style={[picStyles.pText, roboto.bodyLarge]}>Now let's communicate your presence, please update your profile.</Text>
            </View>

            <View style={[picStyles.main, picStyles.imgV]}>
                <TouchableOpacity style={picStyles.imgO} onPress={() => pickImage()}>
                    {
                        image ? <Image source={{ uri: image }} style={picStyles.previewImage} />
                            :
                            <Text style={[roboto.bodyMedium, picStyles.fileText]}>Browse files</Text>
                    }
                </TouchableOpacity>
            </View>

            <View style={[picStyles.main, picStyles.paddingHorizontal]}>
                <View style={picStyles.descHeader}>
                    <Text style={[picStyles.descText, roboto.bodySmall]}>Description</Text>
                    <Text style={[picStyles.descText, roboto.bodySmall]}>{descLength.toString()} / 40</Text>
                </View>
                <TextInput
                    placeholder="Tell us about yourself"
                    placeholderTextColor={"#b3b3b3"}
                    style={[picStyles.descInput, roboto.bodyMedium]}
                    maxLength={40}
                    value={desc}
                    onChangeText={(text) => onEnterDesc(text)}
                />
            </View>

            <View style={[picStyles.main, picStyles.paddingHorizontal]}>
                <Select text="Continue" selected clickable={image ? false : true} selectFun={() => onContinue()} />
            </View>

            <Link href={"/home"} style={[picStyles.main, picStyles.linkText, roboto.mediumEmphasizedBold]}>
                I'll do this later
            </Link>

            {
                loaderVisible ? <Loader /> : null
            }

            {
                errorModal ? <ErrorModal text={errorText} errorFun={() => setErrorText("")} /> : null
            }

            {
                correctModal ? <ErrorModal correct text={correctText} errorFun={() => {setCorrectText("") ; router.replace("/auth/finishReg")}} /> : null
            }

        </SafeAreaView>
    )
}
