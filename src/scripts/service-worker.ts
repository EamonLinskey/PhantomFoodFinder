import { Cordinate } from "./content";

const apiKey = '';

const sucessfulCallStatuses = ["OK", "ZERO_RESULTS"]

const getNearbyRestaurants = async (cordinate: Cordinate): Promise<string[] | null | Error> => {
    // Number of meters around search point to consider. 
    // We want to make this as low as we can while still capturing the target. 
    // I arrived at 15 through trial and error
    const radius = 15;

    // Request to ger results around our location
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?fields=name&location=${cordinate.latitude},${cordinate.longitude}&radius=${radius}&key=${apiKey}`;
    
    const response = await fetch(url);

    // Response.ok tells us if we actually hit a valid webpage
    if(!response.ok) {
      const errorText = 'Unable to connect to the google place API'
      console.error(errorText)
      throw new Error(errorText);
    }

    const json = await response.json();

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