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

export const dummyHostels: DummyHostelsType[] = [
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
    },

    {
        "id": "8421ZX",
        "available": false,
        "distance": 5,
        "images": [
            dummyImages.hostel3,
            dummyImages.hostel9,
            dummyImages.hostel0,
            dummyImages.hostel13,
            dummyImages.hostel6
        ],
        "name": "Sunnydale Court",
        "address": "University Road, Nsukka, Enugu",
        "price": "250,000",
        "amenities": ["kitchen", "running water", "wardrobe", "balcony"],
        "agent": {
            "name": "Grace Nwachukwu",
            "rating": 4,
            "verified": true,
            "contact": 234802112233,
            "pic": images.user0
        }
    },
    {
        "id": "5632PQ",
        "available": true,
        "distance": 1,
        "images": [
            dummyImages.hostel7,
            dummyImages.hostel11,
            dummyImages.hostel5,
            dummyImages.hostel8,
            dummyImages.hostel2
        ],
        "name": "Harbor View Residence",
        "address": "Lekki Phase 2, Lagos",
        "price": "350,000",
        "amenities": ["toilet", "kitchen", "balcony", "24 hours power"],
        "agent": {
            "name": "Oluwaseun Adebayo",
            "rating": 5,
            "verified": true,
            "contact": 234803456789,
            "pic": images.user0
        }
    },
    {
        "id": "2298LM",
        "available": true,
        "distance": 4,
        "images": [
            dummyImages.hostel10,
            dummyImages.hostel12,
            dummyImages.hostel4,
            dummyImages.hostel1,
            dummyImages.hostel14
        ],
        "name": "Palm Heights Hostel",
        "address": "Independence Layout, Enugu",
        "price": "180,000",
        "amenities": ["self contain", "toilet", "kitchen", "water heater"],
        "agent": {
            "name": "Moses Opara",
            "rating": 3,
            "verified": false,
            "contact": 234802998877,
            "pic": images.user0
        }
    },
    {
        "id": "9701BT",
        "available": false,
        "distance": 6,
        "images": [
            dummyImages.hostel2,
            dummyImages.hostel11,
            dummyImages.hostel7,
            dummyImages.hostel9,
            dummyImages.hostel13
        ],
        "name": "Royal Crest Hall",
        "address": "Ikeja GRA, Lagos",
        "price": "500,000",
        "amenities": ["kitchen", "duplex", "security", "AC", "balcony"],
        "agent": {
            "name": "Chika Nwosu",
            "rating": 4,
            "verified": true,
            "contact": 234805667788,
            "pic": images.user0
        }
    },
    {
        "id": "4856NB",
        "available": true,
        "distance": 2,
        "images": [
            dummyImages.hostel6,
            dummyImages.hostel10,
            dummyImages.hostel5,
            dummyImages.hostel14,
            dummyImages.hostel0
        ],
        "name": "Unity Plaza Hostel",
        "address": "Amadi Street, Port Harcourt",
        "price": "220,000",
        "amenities": ["running water", "balcony", "generator", "wardrobe"],
        "agent": {
            "name": "Samuel Dike",
            "rating": 5,
            "verified": true,
            "contact": 234809334455,
            "pic": images.user0
        }
    },
    {
        "id": "1102RE",
        "available": true,
        "distance": 9,
        "images": [
            dummyImages.hostel1,
            dummyImages.hostel2,
            dummyImages.hostel3,
            dummyImages.hostel4,
            dummyImages.hostel5
        ],
        "name": "Serene Heights",
        "address": "Ugbowo, Benin City",
        "price": "160,000",
        "amenities": ["kitchen", "self contain", "running water"],
        "agent": {
            "name": "Ijeoma Okafor",
            "rating": 4,
            "verified": false,
            "contact": 234806778899,
            "pic": images.user0
        }
    },
    {
        "id": "6719AK",
        "available": false,
        "distance": 10,
        "images": [
            dummyImages.hostel11,
            dummyImages.hostel9,
            dummyImages.hostel8,
            dummyImages.hostel7,
            dummyImages.hostel6
        ],
        "name": "Urban Gate Apartments",
        "address": "Ado Ekiti, Ekiti State",
        "price": "190,000",
        "amenities": ["kitchen", "balcony", "security", "water heater"],
        "agent": {
            "name": "John Adekunle",
            "rating": 3,
            "verified": true,
            "contact": 234804445566,
            "pic": images.user0
        }
    },
    {
        "id": "7815QP",
        "available": true,
        "distance": 5,
        "images": [
            dummyImages.hostel13,
            dummyImages.hostel4,
            dummyImages.hostel5,
            dummyImages.hostel2,
            dummyImages.hostel1
        ],
        "name": "Diamond Lodge",
        "address": "Nnamdi Azikiwe University, Awka",
        "price": "130,000",
        "amenities": ["self contain", "24 hours power", "kitchen", "running water"],
        "agent": {
            "name": "Blessing Eze",
            "rating": 4,
            "verified": true,
            "contact": 234808989898,
            "pic": images.user0
        }
    },
    {
        "id": "4237MT",
        "available": true,
        "distance": 3,
        "images": [
            dummyImages.hostel9,
            dummyImages.hostel0,
            dummyImages.hostel3,
            dummyImages.hostel12,
            dummyImages.hostel14
        ],
        "name": "Sunrise Court",
        "address": "Sabo, Yaba, Lagos",
        "price": "270,000",
        "amenities": ["balcony", "AC", "24 hours power", "water heater"],
        "agent": {
            "name": "Adaeze Umeh",
            "rating": 5,
            "verified": true,
            "contact": 234801234567,
            "pic": images.user0
        }
    },
    {
        "id": "9523WB",
        "available": false,
        "distance": 6,
        "images": [
            dummyImages.hostel7,
            dummyImages.hostel10,
            dummyImages.hostel6,
            dummyImages.hostel3,
            dummyImages.hostel9
        ],
        "name": "Lakeside Residency",
        "address": "Kubwa, Abuja",
        "price": "350,000",
        "amenities": ["kitchen", "running water", "balcony"],
        "agent": {
            "name": "Temitope Ogunleye",
            "rating": 4,
            "verified": true,
            "contact": 234807111222,
            "pic": images.user0
        }
    },
    {
        "id": "4420XY",
        "available": true,
        "distance": 4,
        "images": [
            dummyImages.hostel2,
            dummyImages.hostel1,
            dummyImages.hostel3,
            dummyImages.hostel5,
            dummyImages.hostel8
        ],
        "name": "Hilltop Apartments",
        "address": "Gwarinpa Estate, Abuja",
        "price": "280,000",
        "amenities": ["duplex", "toilet", "24 hours power", "wardrobe"],
        "agent": {
            "name": "Chioma Nnaji",
            "rating": 5,
            "verified": true,
            "contact": 234802556677,
            "pic": images.user0
        }
    },
    {
        "id": "5538JQ",
        "available": false,
        "distance": 2,
        "images": [
            dummyImages.hostel14,
            dummyImages.hostel9,
            dummyImages.hostel13,
            dummyImages.hostel8,
            dummyImages.hostel12
        ],
        "name": "Crescent Villas",
        "address": "Eket Road, Uyo",
        "price": "240,000",
        "amenities": ["running water", "AC", "balcony", "kitchen"],
        "agent": {
            "name": "Joseph Effiong",
            "rating": 4,
            "verified": false,
            "contact": 234805998877,
            "pic": images.user0
        }
    },
    {
        "id": "6690PL",
        "available": true,
        "distance": 3,
        "images": [
            dummyImages.hostel3,
            dummyImages.hostel10,
            dummyImages.hostel11,
            dummyImages.hostel1,
            dummyImages.hostel9
        ],
        "name": "Starlight Hostel",
        "address": "Nsukka, Enugu State",
        "price": "150,000",
        "amenities": ["kitchen", "toilet", "running water", "24 hours power"],
        "agent": {
            "name": "Ngozi Anya",
            "rating": 5,
            "verified": true,
            "contact": 234802775533,
            "pic": images.user0
        }
    },
    {
        "id": "2147FV",
        "available": true,
        "distance": 8,
        "images": [
            dummyImages.hostel6,
            dummyImages.hostel4,
            dummyImages.hostel2,
            dummyImages.hostel8,
            dummyImages.hostel10
        ],
        "name": "Golden Gate Lodge",
        "address": "New Haven, Enugu",
        "price": "210,000",
        "amenities": ["balcony", "AC", "24 hours power", "running water"],
        "agent": {
            "name": "Emeka Okorie",
            "rating": 3,
            "verified": false,
            "contact": 234808323232,
            "pic": images.user0
        }
    },
    {
        "id": "7789DR",
        "available": false,
        "distance": 1,
        "images": [
            dummyImages.hostel11,
            dummyImages.hostel12,
            dummyImages.hostel14,
            dummyImages.hostel7,
            dummyImages.hostel5
        ],
        "name": "Evergreen Homes",
        "address": "Trans-Ekulu, Enugu",
        "price": "180,000",
        "amenities": ["running water", "balcony", "toilet", "kitchen"],
        "agent": {
            "name": "Faith Okafor",
            "rating": 4,
            "verified": true,
            "contact": 234808555666,
            "pic": images.user0
        }
    },
    {
        "id": "1198LU",
        "available": true,
        "distance": 9,
        "images": [
            dummyImages.hostel0,
            dummyImages.hostel3,
            dummyImages.hostel6,
            dummyImages.hostel9,
            dummyImages.hostel13
        ],
        "name": "Pearl View Hall",
        "address": "Okpara Avenue, Enugu",
        "price": "200,000",
        "amenities": ["duplex", "balcony", "kitchen", "AC"],
        "agent": {
            "name": "Chidera Onuorah",
            "rating": 5,
            "verified": true,
            "contact": 234807665544,
            "pic": images.user0
        }
    },
    {
        "id": "5602RA",
        "available": false,
        "distance": 6,
        "images": [
            dummyImages.hostel14,
            dummyImages.hostel11,
            dummyImages.hostel8,
            dummyImages.hostel9,
            dummyImages.hostel1
        ],
        "name": "Gracefield Apartments",
        "address": "Wuse II, Abuja",
        "price": "330,000",
        "amenities": ["running water", "security", "duplex", "balcony"],
        "agent": {
            "name": "Joy Adeola",
            "rating": 3,
            "verified": false,
            "contact": 234801778899,
            "pic": images.user0
        }
    }
]
