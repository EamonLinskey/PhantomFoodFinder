// Matches non-alphanumeric text
export const nonAphaNumericRegex = /[^A-Za-z0-9]/g;
// Matches the first number of a string
export const firstNumberRegex = /\d+/;
// Matches text inside parenthesis or brackets
export const insideParensOrBracketsRegex = /\s*[\[{(<].*?[>)}\]]\s*/g
// Matches all instances of  "and", "or", "slash", "with", "plus", "minus" case insensitively
export const commonConjunctionsRegex = /(and|or|slash|with|plus|minus)/gi

