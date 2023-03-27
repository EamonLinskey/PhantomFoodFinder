// Matches non-alphanumeric text
export const nonAphaNumericRegex: RegExp = /[^A-Za-z0-9]/g;
// Matches the first number of a string
export const firstNumberRegex: RegExp = /\d+/;
// Matches text inside parenthesis or brackets
export const insideParensOrBracketsRegex: RegExp = /\s*[\[{(<].*?[>)}\]]\s*/g
// Matches all instances of  "and", "or", "slash", "with", "plus", "minus" case insensitively
export const commonConjunctionsRegex: RegExp = /(and|or|slash|with|plus|minus)/gi

