import {waitForElm} from './HTMLelements';
import {firstNumberRegex} from './regex';
import {Coordinate} from './types';

export const getLatAndLong = async (): Promise<Coordinate | null> => {
	const scriptTag: Element | null = await waitForElm('script[type="application/ld+json"]');

	if (!scriptTag || scriptTag.textContent === null) {
		return null;
	}

	const data = JSON.parse(scriptTag.textContent);
	const latitude = data.geo.latitude;
	const longitude = data.geo.longitude;
	return {
		latitude,
		longitude
	};
};

export const seeIfStreetNumberMatches = (firstAddress: string, secondAddress: string): boolean => {
	const firstStreetNumber = firstAddress.match(firstNumberRegex)?.[0];
	const secondStreetNumber = secondAddress.match(firstNumberRegex)?.[0];

	return firstStreetNumber === secondStreetNumber;
};
