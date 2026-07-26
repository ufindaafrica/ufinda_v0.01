import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

type Props = {
    status: "idle" | "loading" | "compressing" | "uploading" | "posting" | "success" | "error"
    progress: number
    errorText: string
    onDismiss: () => void
}

export default function JobStatusBar({ status, progress, errorText, onDismiss }: Props) {
    const insets = useSafeAreaInsets()

    if (status === "idle") return null

    const isDone = status === "success" || status === "error"

    const label =
        status === "loading" ? "Preparing your ad..." :
        status === "compressing" ? `Compressing photos/video... ${progress}%` :
        status === "uploading" ? `Uploading photos/video... ${progress}%` :
        status === "posting" ? "Publishing your ad..." :
        status === "success" ? "Hostel added successfully!" :
        errorText || "Something went wrong"

    const bg = status === "error" ? "#ead1a3" : status === "success" ? "#DCFCE7" : "#111827"
    const fg = status === "error" ? "#000000" : status === "success" ? "#008000" : "#fff"

    return (
        <View style={{
            position: "absolute",
            top: insets.top,
            left: 0,
            right: 0,
            backgroundColor: bg,
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 999,
            elevation: 10,
        }}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 8 }}>
                {!isDone && <ActivityIndicator size="small" color={fg} />}
                <Text style={{ color: fg, flexShrink: 1 }} numberOfLines={1}>{label}</Text>
            </View>

            {isDone && (
                <TouchableOpacity onPress={onDismiss}>
                    <Text style={{ color: "#be7c00", fontWeight: "600" }}>{errorText?.includes("vendor not verified") ? "Complete the KYC" : "Dismiss"}</Text>
                </TouchableOpacity>
            )}

            {(status === "compressing" || status === "uploading") && (
                <View style={{ position: "absolute", bottom: 0, left: 0, height: 3, width: `${progress}%`, backgroundColor: "#22C55E" }} />
            )}
        </View>
    )
}
