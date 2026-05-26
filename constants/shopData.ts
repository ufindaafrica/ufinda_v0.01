import { ImageSourcePropType } from "react-native";
import { images } from "./images";

export type ShopCategory = {
    id: string;
    label: string;
    icon?: ImageSourcePropType;
};

export type ShopProduct = {
    id: string;
    title: string;
    price: number;
};

export const SHOP_CATEGORIES: ShopCategory[] = [
    { id: "phones", label: "Phones & Tablet" },
    { id: "fashion", label: "Fashion" },
    { id: "tv", label: "Tv & Audio" },
    { id: "generators", label: "Generators" },
    { id: "laptops", label: "Laptops", icon: images.laptop },
    { id: "furniture", label: "Furnitures" },
    { id: "appliances", label: "Home Appliances" },
    { id: "books", label: "Books & Materials" },
];

export const BEST_DEALS: ShopProduct[] = [
    { id: "deal-1", title: "Redmi 13C used", price: 180000 },
    { id: "deal-2", title: "Redmi 13C used", price: 180000 },
    { id: "deal-3", title: "Redmi 13C used", price: 180000 },
];

export const TOP_LAPTOP_DEALS: ShopProduct[] = [
    { id: "laptop-1", title: "Redmi 13C used", price: 180000 },
    { id: "laptop-2", title: "Redmi 13C used", price: 180000 },
    { id: "laptop-3", title: "Redmi 13C used", price: 180000 },
];

export const formatNaira = (amount: number) =>
    `₦${amount.toLocaleString("en-NG")}`;
