import stringSimilarity from 'string-similarity';
import {insideParensOrBracketsRegex, nonAphaNumericRegex, commonConjunctionsRegex} from './regex';

/*
// 'compareTwoStringsReturns' a number between 0 and 1, scoring the degree of similarity between the 
// two strings. 0 indicates completely different strings, 1 indicates identical strings. Because
// string matching is not exact we iteratively clean the strings and keep multiple scores to find the
// most likey matches.
*/
export const scoreRestaurantNameSimilarities = (canidateName: string, confirmedName: string): number => {
	// Filter out text inside parenthesis (becasue it is commonly used to specify address info) and nonalphanumeric
	const cleanedCanidateName = cleanName(canidateName);
	const cleanedConfirmedName = cleanName(confirmedName);

	// This catches edge cases where a resturant has a name that gets entirely filtered out
	if (cleanedCanidateName.length === 0 || cleanedConfirmedName.length === 0) {
		return stringSimilarity.compareTwoStrings(canidateName, confirmedName);
	}

	const basicCleanScore = stringSimilarity.compareTwoStrings(cleanedCanidateName, cleanedConfirmedName);

	// Remove common conjunctions due to inconsistencies in how the conjunction was branded on some sites
	// Ex. Batman & Robin vs Batman + Robin vs Batman and Robin
	// In the above example the basic clean would penalize Batman and Robin compared to the other strings
	// In the deep clean we strip the text conjunctions to accoount for the cases where one name uses a
	// symbol and the other uses text. This could slighly affect scores of restaurants that happen to contain
	// conjunction text, but since its applied to both strings the effect should be small enough
	const deepCleanedCanidateName = deepCleanName(cleanedCanidateName);
	const deepCleanedConfirmedName = deepCleanName(cleanedConfirmedName);

	// This catches edge cases where a resturant has a name that gets entirely filtered out
	if (deepCleanedCanidateName.length === 0 || deepCleanedConfirmedName.length === 0) {
		return stringSimilarity.compareTwoStrings(deepCleanedCanidateName, deepCleanedConfirmedName);
	}

	const deepCleanScore = stringSimilarity.compareTwoStrings(deepCleanedCanidateName, deepCleanedConfirmedName);

	return Math.max(basicCleanScore, deepCleanScore);
};

const cleanName = (name: string): string => {
	name = name.replace(insideParensOrBracketsRegex, '');
	name = name.replace(nonAphaNumericRegex, '');
	return name.toLowerCase();
};

const deepCleanName = (name: string): string => {
	// remove text versions of common conjunctions
	name = name.replace(commonConjunctionsRegex, '');
	return name;
};
