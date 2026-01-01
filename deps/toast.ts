import { Platform, ToastAndroid } from "react-native"


export const toast = (mes: string) => {
    if (Platform.OS === "android") {
        ToastAndroid.show(mes, ToastAndroid.SHORT)
    } 

    if (Platform.OS === 'ios') {
        alert(mes)
    }

    return
}
