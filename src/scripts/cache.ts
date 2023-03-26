import { Cordinate } from "./content";

export const getCachedRestaurantData = async (coordinate: Cordinate) => {
    const cachedResturantsMap : any = await getOrInitilizeRestaurantMap();
    
    return cachedResturantsMap.get(stringifyCoordinate(coordinate)) ?? null;
}

export const updateRestaurantCache = async (cordinate: Cordinate, data: any) => {
    // we want to try the call again later if we are getting no results to double check
    if(data === null || data.restaurants === null) {
        return 
    }
    const restuarantMap = await getOrInitilizeRestaurantMap();

    restuarantMap.set(stringifyCoordinate(cordinate), data)

    await chrome.storage.local.set({ restaurantData: Object.fromEntries(restuarantMap)});
}

export const getOrInitilizeRestaurantMap = async() => {
    const cachedRestaurantMap : any = await chrome.storage.local.get(('restaurantData'));

    if(cachedRestaurantMap?.restaurantData) {
        return new Map(Object.entries(cachedRestaurantMap.restaurantData))
    }

    // Create resturant dictionary the first time we access the cache, or after the cache is cleared
    const newRestaurantMap = new Map();
   
    chrome.storage.local.set({ 'restaurantData': newRestaurantMap });

    return newRestaurantMap;
}

// We turn our coordinates into strings so that we can better serialize the data
const stringifyCoordinate = (cordinate: Cordinate): string => {
    return `${cordinate.latitude}${cordinate.longitude}`
}