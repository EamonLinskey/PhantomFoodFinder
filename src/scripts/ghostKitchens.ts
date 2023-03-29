import {hasPFFBadge, waitForElm} from './HTMLelements';
import {getCachedRestaurantData, updateRestaurantCache} from './cache';
import {Cordinate, ErrorResponse, GooglePlaceRestaurant, isErrorResponse, PageRestaurantData} from './types';
import {getLatAndLong, seeIfStreeNumberMatches} from './addresses';
import {AddBadgeHTMLtoTarget} from './badge';
import {scoreRestaurantNameSimilarities} from './restaurantNameScores';
import {Mutex} from 'async-mutex';

export const identifyKitchenType = (
	restaurantsAtAddress: GooglePlaceRestaurant[],
	pageData: PageRestaurantData
): void => {
	if (restaurantsAtAddress.length === 0) {
		return AddBadgeHTMLtoTarget(restaurantsAtAddress, 'unconfirmedKitchen', pageData);
	}

	// Score restaurants canidates on name similarity to the restuarant from the webpage and sort by that score
	const sortedResturants: GooglePlaceRestaurant[] = restaurantsAtAddress
		.map((resturant: GooglePlaceRestaurant) => {
			return {
				...resturant,
				score: scoreRestaurantNameSimilarities(resturant.name, pageData.name)
			};
		})
		.sort((a, b) => b.score - a.score);

	// Becasue there can be slightl inconsistencies in the name we want to set a threshold with some freedom for
	// inconsistencies. 0.75 was arrived at by trial and error.
	const restaurantMatchThreshold = 0.75;

	if (sortedResturants[0].score > restaurantMatchThreshold) {
		return AddBadgeHTMLtoTarget(restaurantsAtAddress, 'confirmedRealKitchen', pageData);
	} else {
		return AddBadgeHTMLtoTarget(restaurantsAtAddress, 'confirmedGhostKitchen', pageData);
	}
};

const comparePageResturantToCanidates = async (restaurants: GooglePlaceRestaurant[]): Promise<void> => {
	const scriptTag: Element | null = await waitForElm('script[type="application/ld+json"]');
	if (!scriptTag || scriptTag.textContent === null) {
		return;
	}
	const data: PageRestaurantData = JSON.parse(scriptTag.textContent);
	const address: string = data.address.streetAddress;

	/*
    // It is difficult to standardize addresses with different valid text. (ex. 123 East Main Boulevard vs 123 E Main Blvd)
    // I was not able to find a lightweight library to standarize for me and I did not want to write my own standardizations
    // Because our list of potential resturants is likely very small we can afford to take some shortcuts when match for
    // resturants at the location
    */

	// First see if any of the resturants include the entire address in their address. If we get any exact matches we are done
	let restaurantsNearAddress: GooglePlaceRestaurant[] = restaurants.filter((x: GooglePlaceRestaurant) =>
		x.vicinity.includes(address)
	);

	// If we don't get an exact match we can match on jsut the first number in the address. Since we are filtering to a very small
	// radius the likelyhood that we have a exact address number match on a different street is small. However, there is a potential
	// edge case if the resturant is on a cross street close to another business with the same addrerss start number
	if (restaurantsNearAddress.length === 0) {
		const streetNumberMatch = restaurants.filter((x: GooglePlaceRestaurant) =>
			seeIfStreeNumberMatches(x.vicinity, address)
		);

		restaurantsNearAddress = streetNumberMatch;
	}

	identifyKitchenType(restaurantsNearAddress, data);
};

export const checkForGhostKitchens = async (): Promise<void> => {
	// Bail if we have already added badge to the DOM
	if (hasPFFBadge()) {
		return;
	}

	let cordinate: Cordinate | null = await getLatAndLong();

	if (cordinate === null) {
		return;
	}

	let {latitude, longitude} = cordinate;

	// Leave for now to clear data when testing
	// await chrome.storage.local.clear();

	const cachedData = await getCachedRestaurantData(cordinate);

	if (cachedData) {
		await comparePageResturantToCanidates(cachedData);
		return;
	}

	if (latitude && longitude) {
		const response = await new Promise<GooglePlaceRestaurant[] | ErrorResponse>((resolve, reject) => {
			chrome.runtime.sendMessage(
				{type: 'getNearbyRestaurants', cordinate: {latitude, longitude}},
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
			comparePageResturantToCanidates(response);
			updateRestaurantCache(cordinate, response);
		}
	}
};

// We don't want concurrent call of checkForGhostKitchens runnign so we use a mutex to
// ensure  that only one instance can run at a time
const mutex = new Mutex();
export const executeCheckForGhostKitchens = async (): Promise<void> => {
	const release = await mutex.acquire();
	try {
		await checkForGhostKitchens();
	} catch (error: unknown) {
		console.error('An unknow error occured', error);
	} finally {
		release();
	}
};
