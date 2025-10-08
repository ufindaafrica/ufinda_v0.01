import { Text, View } from "react-native";
import { globals } from "@/styles/globals";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={globals.text}>uFinda</Text>
    </View>
  );
}
