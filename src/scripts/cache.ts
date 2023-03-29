import {CachedData, Cordinate, GooglePlaceRestaurant} from './types';

export const getCachedRestaurantData = async (coordinate: Cordinate): Promise<GooglePlaceRestaurant[] | null> => {
	const cachedResturantsMap: Map<string, GooglePlaceRestaurant[]> = await getOrInitilizeRestaurantMap();

	return cachedResturantsMap.get(stringifyCoordinate(coordinate)) ?? null;
};

export const updateRestaurantCache = async (
	cordinate: Cordinate,
	restaurants: GooglePlaceRestaurant[]
): Promise<void> => {
	// we want to try the call again later if we are getting no results to double check
	if (restaurants.length === 0) {
		return;
	}
	const restaurantMap: Map<string, GooglePlaceRestaurant[]> = await getOrInitilizeRestaurantMap();

	restaurantMap.set(stringifyCoordinate(cordinate), restaurants);

	await chrome.storage.local.set({
		restaurantData: Object.fromEntries(restaurantMap)
	});
};

export const getOrInitilizeRestaurantMap = async (): Promise<Map<string, GooglePlaceRestaurant[]>> => {
	const cachedRestaurantMap: CachedData = (await chrome.storage.local.get('restaurantData')) as CachedData;

	if (cachedRestaurantMap?.restaurantData) {
		// The local cache serializes our map, so we have to turn it back into a map type to access it
		return new Map<string, GooglePlaceRestaurant[]>(Object.entries(cachedRestaurantMap.restaurantData));
	}

	// Create resturant dictionary the first time we access the cache, or after the cache is cleared
	const newRestaurantMap = new Map<string, GooglePlaceRestaurant[]>();
	chrome.storage.local.set({restaurantData: newRestaurantMap});

	return newRestaurantMap;
};

// We turn our coordinates into strings so that we can better serialize the data
const stringifyCoordinate = (cordinate: Cordinate): string => {
	return `${cordinate.latitude}${cordinate.longitude}`;
};
