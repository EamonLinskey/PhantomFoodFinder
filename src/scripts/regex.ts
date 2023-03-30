// Matches non-alphanumeric text
export const nonAlphaNumericRegex: RegExp = /[^A-Za-z0-9]/g;

// Matches the first number of a string
export const firstNumberRegex: RegExp = /\d+/;

// Matches text inside parenthesis or brackets
export const insideParensOrBracketsRegex: RegExp = /\s*[\[{(<].*?[>)}\]]\s*/g;

// Matches all instances of  "and", "or", "slash", "with", "plus", "minus" case insensitively
export const commonConjunctionsRegex: RegExp = /(and|or|slash|with|plus|minus)/gi;

// Matches first instance of  "store" or "restaurant" case insensitively
// The different food delivery apps use different names for their restaurant pages
export const restaurantPageUrlRegex = /(store|restaurant)/i;

export const isUrlRestaurantPage = (url: string) => {
	return url.match(restaurantPageUrlRegex);
};
