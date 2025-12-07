import { images } from "./images";


export type chatsType = {
    id: string,
    name: string,
    chats: string[],
    unread: boolean,
    unread_mes: number,
    profile_pic: any,
    last_mes_date: Date
}

export const chats = [
    {
        "id": "1",
        "name": "Tunde Ednut",
        "chats": [],
        "unread": false,
        "unread_mes": 0,
        "profile_pic": images.user0,
        "last_mes_date": new Date()
    },
    {
        "id": "1",
        "name": "Chika Nedu",
        "chats": [
            "i'm a vendor"
        ],
        "unread": true,
        "unread_mes": 2,
        "profile_pic": images.user0,
        "last_mes_date": new Date()
    },
    {
        "id": "1",
        "name": "Clinton Onwukwe",
        "chats": [],
        "unread": false,
        "unread_mes": 0,
        "profile_pic": null,
        "last_mes_date": new Date()
    },
    {
        "id": "1",
        "name": "Gerald Mbah",
        "chats": [],
        "unread": false,
        "unread_mes": 0,
        "profile_pic": null,
        "last_mes_date": new Date()
    },
    {
        "id": "1",
        "name": "Queendaline GodsFavour",
        "chats": [],
        "unread": true,
        "unread_mes": 4,
        "profile_pic": null,
        "last_mes_date": new Date()
    },
    {
        "id": "1",
        "name": "Providence Achi",
        "chats": [],
        "unread": false,
        "unread_mes": 0,
        "profile_pic": images.user0,
        "last_mes_date": new Date()
    },
    {
        "id": "1",
        "name": "Tochi Prosper",
        "chats": [],
        "unread": false,
        "unread_mes": 0,
        "profile_pic": null,
        "last_mes_date": new Date()
    },
    {
        "id": "1",
        "name": "Ifeoma Tender",
        "chats": [],
        "unread": false,
        "unread_mes": 0,
        "profile_pic": images.user0,
        "last_mes_date": new Date()
    },
    {
        "id": "1",
        "name": "Udeh Nneka",
        "chats": [],
        "unread": false,
        "unread_mes": 0,
        "profile_pic": null,
        "last_mes_date": new Date()
    },
    {
        "id": "1",
        "name": "Nneoma Patricia",
        "chats": [],
        "unread": false,
        "unread_mes": 0,
        "profile_pic": images.user0,
        "last_mes_date": new Date()
    },
]
