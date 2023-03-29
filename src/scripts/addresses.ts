import { waitForElm } from "./HTMLelements";
import { firstNumberRegex } from "./regex";
import { Cordinate } from "./types";

export const getLatAndLong = async (): Promise<Cordinate | null> => {
    const scriptTag: Element | null = await waitForElm('script[type="application/ld+json"]');
    
    if(!scriptTag || scriptTag.textContent === null) {
        return null; 
    }

    const data = JSON.parse(scriptTag.textContent);
    const latitude = data.geo.latitude;
    const longitude = data.geo.longitude;
    return {
        latitude,
        longitude
    }
};

export const seeIfStreeNumberMatches = (firstAddress: string, secondAddress: string): boolean => {
    const firstStreetNumber = firstAddress.match(firstNumberRegex)?.[0];
    const secondStreetNumber = secondAddress.match(firstNumberRegex)?.[0];

    return firstStreetNumber === secondStreetNumber;
}
