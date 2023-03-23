import { Cordinate } from "./content";

const apiKey = '';

const getNearbyRestaurants = async (cordinate: Cordinate): Promise<string[] | null> => {
    // Number of meters around search point to consider. 
    // We want to make this as low as we can while still capturing the target. 
    // I arrived at 15 through trial and error
    const radius = 15;

    // Request to ger results around our location
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?fields=name&location=${cordinate.latitude},${cordinate.longitude}&radius=${radius}&key=${apiKey}`;
    
    const response = await fetch(url);
    const json = await response.json();

  
    if (json?.results && json.results.length > 0) {
      return json.results;
    } else {
      return null;
    }
  };

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'getNearbyRestaurants') {
    getNearbyRestaurants(request.cordinate)
      .then((restaurants) => {
          sendResponse({ restaurants });
      })
      .catch((error) => {
        const errorMessage = `Error retrieving restaurant name: ${error}`;
          console.error(errorMessage);
          sendResponse({ error: errorMessage });
      });
  }
  // We must return true in order to communicate that response will be asynchronous
  return true;
});