import {executeCheckForGhostKitchens} from './ghostKitchens';
import {isUrlRestaurantPage} from './regex';
import {UrlUpdateResponse} from './types';

// On initial page load check for ghost kitchens if we are on a restuarant page
// We might initilize the extension outside of the resaurant page because the
// content_script is not always loaded when navigating within a webpage
if (isUrlRestaurantPage(window.location.href)) {
	executeCheckForGhostKitchens();
}

// Add a listener to run our check when loading other pages on the same site
chrome.runtime.onMessage.addListener((request: UrlUpdateResponse) => {
	if (request.message === 'urlUpdated' && isUrlRestaurantPage(request.url)) {
		executeCheckForGhostKitchens();
	}
});
