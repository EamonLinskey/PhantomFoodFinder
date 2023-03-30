import stringSimilarity from 'string-similarity';
import {insideParensOrBracketsRegex, nonAlphaNumericRegex, commonConjunctionsRegex} from './regex';

/*
// 'compareTwoStringsReturns' a number between 0 and 1, scoring the degree of similarity between the 
// two strings. 0 indicates completely different strings, 1 indicates identical strings. Because
// string matching is not exact we iteratively clean the strings and keep multiple scores to find the
// most likely matches.
*/
export const scoreRestaurantNameSimilarities = (candidateName: string, confirmedName: string): number => {
	// Filter out text inside parenthesis (because it is commonly used to specify address info) and non-alphanumeric
	const cleanedCandidateName = cleanName(candidateName);
	const cleanedConfirmedName = cleanName(confirmedName);

	// This catches edge cases where a restaurant has a name that gets entirely filtered out
	if (cleanedCandidateName.length === 0 || cleanedConfirmedName.length === 0) {
		return stringSimilarity.compareTwoStrings(candidateName, confirmedName);
	}

	const basicCleanScore = stringSimilarity.compareTwoStrings(cleanedCandidateName, cleanedConfirmedName);

	// Remove common conjunctions due to inconsistencies in how the conjunction was branded on some sites
	// Ex. Batman & Robin vs Batman + Robin vs Batman and Robin
	// In the above example the basic clean would penalize Batman and Robin compared to the other strings
	// In the deep clean we strip the text conjunctions to account for the cases where one name uses a
	// symbol and the other uses text. This could slightly affect scores of restaurants that happen to contain
	// conjunction text, but since its applied to both strings the effect should be small enough
	const deepCleanedCandidateName = deepCleanName(cleanedCandidateName);
	const deepCleanedConfirmedName = deepCleanName(cleanedConfirmedName);

	// This catches edge cases where a restaurant has a name that gets entirely filtered out
	if (deepCleanedCandidateName.length === 0 || deepCleanedConfirmedName.length === 0) {
		return stringSimilarity.compareTwoStrings(deepCleanedCandidateName, deepCleanedConfirmedName);
	}

	const deepCleanScore = stringSimilarity.compareTwoStrings(deepCleanedCandidateName, deepCleanedConfirmedName);

	return Math.max(basicCleanScore, deepCleanScore);
};

const cleanName = (name: string): string => {
	name = name.replace(insideParensOrBracketsRegex, '');
	name = name.replace(nonAlphaNumericRegex, '');
	return name.toLowerCase();
};

const deepCleanName = (name: string): string => {
	// remove text versions of common conjunctions
	name = name.replace(commonConjunctionsRegex, '');
	return name;
};
