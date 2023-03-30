import stringSimilarity from 'string-similarity';
import jwDistance from 'jaro-winkler';
import {insideParensOrBracketsRegex, nonAlphaNumericRegex, commonConjunctionsRegex} from './regex';

/*
// This returns a number between 0 and 1 for each restaurant name, scoring the degree of similarity between 
// the two strings. 0 indicates completely different strings, 1 indicates identical strings. Because
// string matching is not exact we iteratively clean the strings and keep multiple scores to find the
// most likely matches.
*/
export const scoreRestaurantNameSimilarities = (candidateName: string, confirmedName: string): number => {
	// Filter out text inside parenthesis (because it is commonly used to specify address info) and non-alphanumeric
	const cleanedCandidateName = cleanName(candidateName);
	const cleanedConfirmedName = cleanName(confirmedName);

	// This catches edge cases where a restaurant has a name that gets entirely filtered out
	if (cleanedCandidateName.length === 0 || cleanedConfirmedName.length === 0) {
		return getStringSimilarityScore(candidateName, confirmedName);
	}

	const basicCleanScore = getStringSimilarityScore(cleanedCandidateName, cleanedConfirmedName);

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
		return getStringSimilarityScore(deepCleanedCandidateName, deepCleanedConfirmedName);
	}

	const deepCleanScore = getStringSimilarityScore(deepCleanedCandidateName, deepCleanedConfirmedName);

	return Math.max(basicCleanScore, deepCleanScore);
};

/* 
// Here we I am using the Dice's Coefficient (stringSimilarity) and Jaro-Winkler distance (jwDistance) 
// at the same time to compare string similarity. I am weighting them the same and taking the higher value
// This is probably naive and doesn't take into account the strengths and weaknesses of each approach.
// However, for now it seems a cheap enough approach compared to implementing true NLP with reasonable 
// accuracy for our purposes
*/
const getStringSimilarityScore = (a: string, b:string) : number => {
	return Math.max(stringSimilarity.compareTwoStrings(a, b), jwDistance(a,b));
}

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
