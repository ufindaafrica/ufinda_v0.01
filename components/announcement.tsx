import { images } from "@/constants/images";
import { announcementStyles } from "@/styles/componentStyles/announcement";
import { JSX } from "react";
import { Image, TouchableOpacity, View } from "react-native";


type AnnouncementProps = {
    active?: boolean,
    view: JSX.Element
}

export default function Announcement ({ active, view } : AnnouncementProps) {
    return (
        <View style={[announcementStyles.main, active && announcementStyles.activeMain]}>

            {view}

            <TouchableOpacity style={[announcementStyles.touch, !active && announcementStyles.activeTouch]}>
                <Image source={active ? images.arrowRight : images.whiteArrowRight} style={announcementStyles.img} />
            </TouchableOpacity>

        </View>
    )
}
