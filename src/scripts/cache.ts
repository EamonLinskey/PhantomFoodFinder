import {CachedData, Coordinate, GooglePlaceRestaurant} from './types';

export const getCachedRestaurantData = async (coordinate: Coordinate): Promise<GooglePlaceRestaurant[] | null> => {
	const cachedRestaurantsMap: Map<string, GooglePlaceRestaurant[]> = await getOrInitializeRestaurantMap();

	return cachedRestaurantsMap.get(stringifyCoordinate(coordinate)) ?? null;
};

export const updateRestaurantCache = async (
	coordinate: Coordinate,
	restaurants: GooglePlaceRestaurant[]
): Promise<void> => {
	// we want to try the call again later if we are getting no results to double check
	if (restaurants.length === 0) {
		return;
	}
	const restaurantMap: Map<string, GooglePlaceRestaurant[]> = await getOrInitializeRestaurantMap();

	restaurantMap.set(stringifyCoordinate(coordinate), restaurants);

	await chrome.storage.local.set({
		restaurantData: Object.fromEntries(restaurantMap)
	});
};

export const getOrInitializeRestaurantMap = async (): Promise<Map<string, GooglePlaceRestaurant[]>> => {
	const cachedRestaurantMap: CachedData = (await chrome.storage.local.get('restaurantData')) as CachedData;

	if (cachedRestaurantMap?.restaurantData) {
		// The local cache serializes our map, so we have to turn it back into a map type to access it
		return new Map<string, GooglePlaceRestaurant[]>(Object.entries(cachedRestaurantMap.restaurantData));
	}

	// Create restaurant dictionary the first time we access the cache, or after the cache is cleared
	const newRestaurantMap = new Map<string, GooglePlaceRestaurant[]>();
	chrome.storage.local.set({restaurantData: newRestaurantMap});

	return newRestaurantMap;
};

// We turn our coordinates into strings so that we can better serialize the data
const stringifyCoordinate = (coordinate: Coordinate): string => {
	return `${coordinate.latitude}${coordinate.longitude}`;
};
