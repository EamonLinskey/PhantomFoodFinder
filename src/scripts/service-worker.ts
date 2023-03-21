import { Cordinate } from "./content";

const apiKey = '';

const getRestaurantName = async (cordinate: Cordinate): Promise<string[] | null> => {
    cordinate.latitude, cordinate.longitude
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?fields=name&location=${cordinate.latitude},${cordinate.longitude}&radius=300&type=restaurant&key=${apiKey}`;
    const response = await fetch(url);
    console.log(response)
    const json = await response.json();
    console.log(json)

  
    if (json && json.results && json.results.length > 0) {
      return json.results;
    } else {
      return null;
    }
  };

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getRestaurantName') {
        console.log(request)
        getRestaurantName(request.cordinate)
            .then((restaurantName) => {
                sendResponse({ restaurantName });
            })
            .catch((error) => {
                console.error(`Error retrieving restaurant name: ${error}`);
                sendResponse({ error: `Error retrieving restaurant name: ${error}` });
            });
    }
    // We must return true in order to communicate that response will be asynchronous
    return true;
  });