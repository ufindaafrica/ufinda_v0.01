
export type EnrichedHostel = {
    created_at: string,
    description: string,
    hostel_images: Array<HostelMedia>,
    hostel_videos: Array<HostelMedia>,
    id: string,
    kitchen_access: 'personal' | 'public',
    landlord_resides: 'yes' | 'no',
    location: 'string',
    rent_per_year: number,
    room_type: string,
    roommates_allowed: 'yes' | 'no',
    title: string,
    toilet_access: 'personal' | 'public',
    total_hostel_rooms: number,
    total_price: number,
    updated_at: string,
    vendor_id: string,
    vendor_info: VendorInfo
}

type HostelMedia = {
    public_id: string,
    url: string
}

type VendorInfo = {
    first_name: string,
    last_name: string,
    phone: string,
    vendor_kyc: VendorKyc,
    vendor_metrics: VendorMetrics
}

type VendorKyc = {
    profile_img: HostelMedia,
}

type VendorMetrics = {
    current_rating: number,
    total_rating: number
}
