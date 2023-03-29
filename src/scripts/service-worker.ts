import { ContentScriptRequest, ErrorResponse, GooglePlaceApiResponse, GooglePlaceRestaurant, RestaurantDataResponse, sucessfulCallStatuses } from "./types";
import { Cordinate } from "./types";

const apiKey: string = '';

const getNearbyRestaurants = async (cordinate: Cordinate): Promise<GooglePlaceRestaurant[] | null> => {
    // Number of meters around search point to consider. 
    // We want to make this as low as we can while still capturing the target. 
    // I arrived at 50 through trial and error
    const radius = 50;

    // Request to ger results around our location
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?fields=name&location=${cordinate.latitude},${cordinate.longitude}&radius=${radius}&key=${apiKey}`;

    const response: Response = await fetch(url);

    // Response.ok tells us if we actually hit a valid webpage
    if(!response.ok) {
      const errorText = 'Unable to connect to the google place API'
      console.error(errorText)
      throw new Error(errorText);
    }

    const json: GooglePlaceApiResponse = await response.json();

    // json.status describes what we found after we hit the API webpage
    if(!sucessfulCallStatuses.includes(json.status)) {
      const errorText = `There was a problem with our request the google place API. Response: "${json.status}"`
      console.error(errorText)
      throw new Error(errorText);
    }
  
    if (json?.results && json.results.length > 0) {
      return json.results;
    } else {
      return null;
    }
  };

// Adds a listener that waits for messages from the content_scripts
// When it recieves a getNearbyRestaurants request we call the API and emit the data 
chrome.runtime.onMessage.addListener(
  (request: ContentScriptRequest, _sender: chrome.runtime.MessageSender, sendResponse: (response?: GooglePlaceRestaurant[] | null | ErrorResponse) => void): boolean => {
    if (request.type === 'getNearbyRestaurants') {
      getNearbyRestaurants(request.cordinate)
        .then((restaurantData: GooglePlaceRestaurant[] | null) => {
          sendResponse(restaurantData);
        })
        .catch((error: Error) => {
          const errorMessage = `Error retrieving restaurant name: ${error}`;
          console.error(errorMessage);
          sendResponse({ error: errorMessage });
        });
    }
    // We must return true in order to communicate that response will be asynchronous
    return true;
  });
  
// Add listener that will emit a message whenever the url changes. 
// This will let use rerun our checks when navigating through multiple pages on a website
chrome.tabs.onUpdated.addListener(
  (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
    if (changeInfo.url) {
      chrome.tabs.sendMessage( tabId, {
        message: 'urlUpdated',
        url: changeInfo.url
      })

    }
  }
);