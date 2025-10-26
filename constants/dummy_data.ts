import { dummyImages } from "./dummy_images";
import { images } from "./images";

export type DummyHostelsType = {
    id: string,
    available: boolean,
    distance: number,
    images: Array<any>,
    name: string,
    address: string,
    price: string,
    amenities: Array<string>,
    agent: AgentInfoType
}

type AgentInfoType = {
    name: string,
    rating: number,
    verified: boolean,
    contact: number,
    pic: any
}

export const dummyHostels : DummyHostelsType[] = [
    {
        "id": "1234AB",
        "available": true,
        "distance": 3,
        "images": [
            dummyImages.hostelbg,
            dummyImages.hostel0,
            dummyImages.hostel3,
            dummyImages.hostel7
        ],
        "name": "Bethel Lodge",
        "address": "Old Ikoyi, Ikoyi Lagos",
        "price": "280,000",
        "amenities": ["self contain", "toilet", "kitchen", "duplex", "24 hours power"],
        "agent": {
            "name": "Adeyemi Martins",
            "rating": 4,
            "verified": true,
            "contact": 234808080,
            "pic": images.user0
        }
    },

    {
        "id": "7834TY",
        "available": true,
        "distance": 8,
        "images": [
            dummyImages.hostelbg2,
            dummyImages.hostel1,
            dummyImages.hostel9,
            dummyImages.hostel2,
            dummyImages.hostel10
        ],
        "name": "Lady Franka Lodge",
        "address": "Akanu Ibiam Road",
        "price": "120,000",
        "amenities": ["toilet", "kitchen", "running water", "24 hours power"],
        "agent": {
            "name": "Eugene Edet",
            "rating": 5,
            "verified": true,
            "contact": 234808080,
            "pic": images.user0
        }
    },

    {
        "id": "3452RQ",
        "available": false,
        "distance": 2,
        "images": [
            dummyImages.hostelbg3,
            dummyImages.hostel11,
            dummyImages.hostel14,
            dummyImages.hostel12,
            dummyImages.hostel13
        ],
        "name": "Rich Kids Apartments",
        "address": "Aso Rock, Abuja",
        "price": "300,000",
        "amenities": ["kitchen", "duplex", "24 hours power"],
        "agent": {
            "name": "Abubakar Fatima",
            "rating": 3,
            "verified": false,
            "contact": 234808080,
            "pic": images.user0
        }
    },


    {
        "id": "0993SF",
        "available": true,
        "distance": 7,
        "images": [
            dummyImages.hostelbg4,
            dummyImages.hostel4,
            dummyImages.hostel5,
            dummyImages.hostel6,
            dummyImages.hostel8
        ],
        "name": "Queen Rose Luxury Halls",
        "address": "Owerri, Imo State",
        "price": "400,000",
        "amenities": ["kitchen", "duplex", "24/7 water"],
        "agent": {
            "name": "Edeh JohnBosco",
            "rating": 5,
            "verified": true,
            "contact": 234808080,
            "pic": images.user0
        }
    }
]
