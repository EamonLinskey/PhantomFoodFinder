export type Cordinate = {
	latitude: number;
	longitude: number;
};

export type ContentScriptFunctionNames = 'getNearbyRestaurants';

export type ErrorResponse = {
	error: string;
};

export type ContentScriptRequest = {
	type: ContentScriptFunctionNames;
	cordinate: Cordinate;
};

export type PageRestaurantData = {
	name: string;
	address: {
		streetAddress: string;
	};
};

export type GooglePlaceApiResponse = {
	results: GooglePlaceRestaurant[];
};

// More properties are returned but these are they only ones we use
export type GooglePlaceRestaurant = {
	name: string;
	vicinity: string;
	// we generate this prop, it is not returned from the API
	score?: number;
};

export type CachedData = {
	restaurantData: RestaurantData;
};

export type RestaurantDataResponse = {
	restaurantData: GooglePlaceRestaurant[] | null;
};

export type RestaurantData = {
	[key: string]: GooglePlaceRestaurant[];
};

export function isErrorResponse(value: unknown): value is ErrorResponse {
	return (
		typeof value === 'object' &&
		value !== null &&
		'error' in value &&
		typeof (value as ErrorResponse).error === 'string'
	);
}

export type BadgeType = 'confirmedGhostKitchen' | 'confirmedRealKitchen' | 'unconfirmedKitchen';

export type UrlUpdateResponse = {
	message: string;
	url: string;
};
