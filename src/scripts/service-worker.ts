import {
	ContentScriptRequest,
	ErrorResponse,
	GooglePlaceApiResponse,
	GooglePlaceRestaurant,
} from './types';
import {Cordinate} from './types';

const getNearbyRestaurants = async (cordinate: Cordinate): Promise<GooglePlaceRestaurant[]> => {
	// AWS Proxy Server
	const url = `https://0d7e82esla.execute-api.us-east-2.amazonaws.com/default/PhantomFoodFinderRestaurantLocation`

	const response: Response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify({
			latitude: cordinate.latitude,
			longitude: cordinate.longitude
		}),
	});

	const json: GooglePlaceApiResponse = await response.json();

	return json.results;
};

// Adds a listener that waits for messages from the content_scripts
// When it recieves a getNearbyRestaurants request we call the API and emit the data
chrome.runtime.onMessage.addListener(
	(
		request: ContentScriptRequest,
		_sender: chrome.runtime.MessageSender,
		sendResponse: (response?: GooglePlaceRestaurant[] | null | ErrorResponse) => void
	): boolean => {
		if (request.type === 'getNearbyRestaurants') {
			getNearbyRestaurants(request.cordinate)
				.then((restaurantData: GooglePlaceRestaurant[] | null) => {
					sendResponse(restaurantData);
				})
				.catch((error: Error) => {
					const errorMessage = `Error retrieving restaurant name: ${error}`;
					console.error(errorMessage);
					sendResponse({error: errorMessage});
				});
		}
		// We must return true in order to communicate that response will be asynchronous
		return true;
	}
);

// Add listener that will emit a message whenever the url changes.
// This will let use rerun our checks when navigating through multiple pages on a website
chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
	if (changeInfo.url) {
		chrome.tabs.sendMessage(tabId, {
			message: 'urlUpdated',
			url: changeInfo.url
		});
	}
});
