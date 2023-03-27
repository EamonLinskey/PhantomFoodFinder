export type Cordinate = {
    latitude: number
    longitude: number
}

export type ContentScriptFunctionNames = 'getNearbyRestaurants';

export type ErrorResponse = { 
    error: string 
}

export type ContentScriptRequest = {
    type: ContentScriptFunctionNames;
    cordinate: Cordinate;
}

export type PageRestaurantData = {
    name: string;
    address: {
        streetAddress: string;
    }
}

//https://developers.google.com/maps/documentation/places/web-service/search-nearby#PlacesSearchStatus
export type PlaceSearchStatus = 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED ' | 'UNKNOWN_ERROR ';
export const sucessfulCallStatuses: PlaceSearchStatus[] = ["OK", "ZERO_RESULTS"]

export type GooglePlaceApiResponse = {
    html_attributions: any[];
    results: GooglePlaceRestaurant[];
    status: PlaceSearchStatus;
}

// More properties are returned but these are they only ones we use
export type GooglePlaceRestaurant = {
    name: string;
    vicinity: string;
    // we generate this prop, it is not returned from the API
    score?: number;
} 

export type CachedData = {
    restaurantData: RestaurantData
}

export type RestaurantDataResponse = {
    restaurantData: GooglePlaceRestaurant[] | null
}

export type RestaurantData = {
    [key: string]: GooglePlaceRestaurant[]
}

export function isErrorResponse(value: unknown): value is ErrorResponse {
    return typeof value === 'object' && value !== null && 'error' in value && typeof (value as ErrorResponse).error === 'string';
}

export type BadgeType = 'confirmedGhostKitchen' | 'confirmedRealKitchen' | 'unconfirmedKitchen';