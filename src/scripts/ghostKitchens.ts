import {hasPFFBadge, waitForElm} from './HTMLelements';
import {getCachedRestaurantData, updateRestaurantCache} from './cache';
import {Coordinate, ErrorResponse, GooglePlaceRestaurant, isErrorResponse, PageRestaurantData} from './types';
import {getLatAndLong, seeIfStreetNumberMatches} from './addresses';
import {AddBadgeHTMLtoTarget} from './badge';
import {scoreRestaurantNameSimilarities} from './restaurantNameScores';
import {Mutex} from 'async-mutex';

const identifyKitchenTypeAndAddBadge = async (restaurants: GooglePlaceRestaurant[]): Promise<void> => {
	const scriptTag: Element | null = await waitForElm('script[type="application/ld+json"]');
	if (!scriptTag || scriptTag.textContent === null) {
		return;
	}
	const data: PageRestaurantData = JSON.parse(scriptTag.textContent);
	const address: string = data.address.streetAddress;

	// Score restaurants candidates on name similarity to the restaurant from the webpage and sort by that score
	const sortedRestaurants: GooglePlaceRestaurant[] = restaurants
		.map((restaurant: GooglePlaceRestaurant) => {
			return {
				...restaurant,
				score: scoreRestaurantNameSimilarities(restaurant.name, data.name)
			};
		})
		.sort((a, b) => b.score - a.score);

	// Because there can be slight inconsistencies in the name we want to set a threshold with some freedom for
	// inconsistencies. 0.75 was arrived at by trial and error.
	const restaurantMatchThreshold = 0.75;

	if (sortedRestaurants[0].score > restaurantMatchThreshold) {
		// If we have a name match we will assume its the restaurant in question without confirming the address
		// The vicinity prop is inconsistent for business without the restaurant type so we don't use it here to verify
		return AddBadgeHTMLtoTarget(sortedRestaurants, 'confirmedRealKitchen', data);
	} 

	/*
	// If we do not match the restaurant name we want to identify candidate restaurants the could be the ghost kitchen as best 
	// as possible using the vicinities.It is difficult to standardize addresses with different valid text. 
	// (ex. 123 East Main Boulevard vs 123 E Main Blvd)
	// I was not able to find a lightweight library to standardize for me and I did not want to write my own standardizations
	// Because our list of potential restaurants is likely very small we can afford to take some shortcuts when match for
	// restaurants at the location
	*/

	// First see if any of the restaurants include the entire address in their address. If we get any exact matches we are done
	let restaurantsNearAddress: GooglePlaceRestaurant[] = restaurants.filter((x: GooglePlaceRestaurant) =>
		x.vicinity.includes(address)
	);

	// If we don't get an exact match we can match on just the first number in the address. Since we are filtering to a very small
	// radius the likelihood that we have a exact address number match on a different street is small. However, there is a potential
	// edge case if the restaurant is on a cross street close to another business with the same address start number
	if (restaurantsNearAddress.length === 0) {
		const streetNumberMatch = restaurants.filter((x: GooglePlaceRestaurant) =>
			seeIfStreetNumberMatches(x.vicinity, address)
		);

		restaurantsNearAddress = streetNumberMatch;

	}
	
	if (restaurantsNearAddress.length > 0) {
		// Confirmed another business at that address and no business in the area with a matching name
		return AddBadgeHTMLtoTarget(restaurantsNearAddress, 'confirmedGhostKitchen', data);
	} else {
		// Could not find any businesses at the listed address nor any nearby with the restaurant's name
		return AddBadgeHTMLtoTarget(restaurantsNearAddress, 'unconfirmedKitchen', data);
	};
};

export const checkForGhostKitchens = async (): Promise<void> => {
	// Bail if we have already added badge to the DOM
	if (hasPFFBadge()) {
		return;
	}

	let coordinate: Coordinate | null = await getLatAndLong();

	if (coordinate === null) {
		return;
	}

	let {latitude, longitude} = coordinate;

	// Leave for now to clear data when testing
	await chrome.storage.local.clear();

	const cachedData = await getCachedRestaurantData(coordinate);

	if (cachedData) {
		await identifyKitchenTypeAndAddBadge(cachedData);
		return;
	}

	if (latitude && longitude) {
		const response = await new Promise<GooglePlaceRestaurant[] | ErrorResponse>((resolve, reject) => {
			chrome.runtime.sendMessage(
				{type: 'getNearbyRestaurants', coordinate: {latitude, longitude}},
				(response: GooglePlaceRestaurant[] | ErrorResponse) => {
					if (isErrorResponse(response)) {
						reject(response.error);
					} else {
						resolve(response);
					}
				}
			);
		});

		if (isErrorResponse(response)) {
			console.error(response.error);
			return;
		} else {
			identifyKitchenTypeAndAddBadge(response);
			updateRestaurantCache(coordinate, response);
		}
	}
};

// We don't want concurrent call of checkForGhostKitchens running so we use a mutex to
// ensure  that only one instance can run at a time
const mutex = new Mutex();
export const executeCheckForGhostKitchens = async (): Promise<void> => {
	const release = await mutex.acquire();
	try {
		await checkForGhostKitchens();
	} catch (error: unknown) {
		console.error('An unknown error occurred', error);
	} finally {
		release();
	}
};
