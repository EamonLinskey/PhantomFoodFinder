import { waitForElm } from './helpers';
import stringSimilarity from 'string-similarity';
import { commonConjunctionsRegex, firstNumberRegex, insideParensOrBracketsRegex, nonAphaNumericRegex } from './regex';
import { getCachedRestaurantData, updateRestaurantCache } from './cache';

export type Cordinate = {
    latitude: number
    longitude: number
}

const getLatAndLong = async (): Promise<Cordinate> => {
    const scriptTag : any = 
        await waitForElm('script[type="application/ld+json"]');
    const data = JSON.parse(scriptTag.textContent);
    const latitude = data.geo.latitude;
    const longitude = data.geo.longitude;
    return {
        latitude,
        longitude
    }
};

const seeIfStreeNumberMatches = (a: string, b: string) => {
    const aStreet = a.match(firstNumberRegex) ?? [];
    const bStreet = b.match(firstNumberRegex) ?? [];

    if(aStreet.length === 0 || bStreet.length === 0) {
        return false;
    }

    return aStreet[0] === bStreet[0]
}

/*
// 'compareTwoStringsReturns' a number between 0 and 1, scoring the degree of similarity between the 
// two strings. 0 indicates completely different strings, 1 indicates identical strings. Because
// string matching is not exact we iteratively clean the strings and keep multiple scores to find the
// most likey matches.
*/
const scoreRestaurantNameSimilarities = (canidateName: string, confirmedName: string): number => {
    // Filter out text inside parenthesis (becasue it is commonly used to specify address info) and nonalphanumeric 
    const cleanedCanidateName = cleanName(canidateName);
    const cleanedConfirmedName = cleanName(confirmedName);

    // This catches edge cases where a resturant has a name that gets entirely filtered out
    if(cleanedCanidateName.length === 0 || cleanedConfirmedName.length === 0) {
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
    if(deepCleanedCanidateName.length === 0 || deepCleanedConfirmedName.length === 0) {
        return stringSimilarity.compareTwoStrings(deepCleanedCanidateName, deepCleanedConfirmedName);
    }

    const deepCleanScore = stringSimilarity.compareTwoStrings(deepCleanedCanidateName, deepCleanedConfirmedName);

    return Math.max(basicCleanScore, deepCleanScore); 
}   

const cleanName = (name: string): string => {
    name = name.replace(insideParensOrBracketsRegex, '')
    name = name.replace(nonAphaNumericRegex, '')
    return name.toLowerCase()
}

const deepCleanName = (name: string): string => {
    // remove text versions of common conjunctions 
    name = name.replace(commonConjunctionsRegex, '')
    return name
}



const compareResturanttoResults = async (results: any ) => {
    const scriptTag : any = 
        await waitForElm('script[type="application/ld+json"]');
    const data = JSON.parse(scriptTag.textContent);
    const address = data.address.streetAddress
    const name = data.name
    const restaurants = results.restaurants;


    /*
    // It is difficult to standardize addresses with different valid text. (ex. 123 East Main Boulevard vs 123 E Main Blvd)
    // I was not able to find a lightweight library to standarize for me and I did not want to write my own standardizations
    // Because our list of potential resturants is likely very small we can afford to take some shortcuts when match for
    // resturants at the location
    */

    // First see if any of the resturants include the entire address in their address. If we get any exact matches we are done
    const includesAddressMatches = restaurants.filter((x: any) => x.vicinity.includes(address));


    let restaurantsNearAddress = includesAddressMatches;

    // If we don't get an exact match we can match on jsut the first number in the address. Since we are filtering to a very small 
    // radius the likelyhood that we have a exact address number match on a different street is small. However, there is a potential
    // edge case if the resturant is on a cross street close to another business with the same addrerss start number
    if(restaurantsNearAddress.length === 0){
        const streetNumberMatch = restaurants.filter((x: any) => seeIfStreeNumberMatches(x.vicinity, address));

        restaurantsNearAddress = streetNumberMatch;
    }

    // If we still don't have any matches we should list the nearby resturants as potential matches
    if(restaurantsNearAddress.length === 0){
        //TODO write case for explaing no matches but here are some nearby resturants
        // Sort by scores still
    }
    
    compareNames(restaurantsNearAddress, name, address);
}

const compareNames = (restaurantsAtAddress: any[], name: string, address: string) => {
    const el = document.querySelector('h1');
    if(el) {
        el.style.display = 'flex'
        el.style.alignItems = 'center'

    }

    if(restaurantsAtAddress.length === 0 && el) {
        el.innerHTML += `
        <span class="PFF-tooltip">
            <div class="PFF-kitchen-text PFF-potentially-haunted-text">Potentially Haunted</div>
            <div>❓</div>
            <span class="PFF-tooltip-text">
                <span class='PFF-max-content PFF-display-block'> There are no resturants verified at
                    <a target='_blank' href='https://www.google.com/maps/place/${address}'>
                        this location.
                    </a>
                    This may be due to google maps data not being up to date
                </span>
            </span>
        </span>`;
    }

    const restaurantsAtAddressName = restaurantsAtAddress.map((x:any) => x.name);
    //TODO update compareTwoStrings  to better acccount for ampersand +'s or any other inconsistencies
    const nameSimilarities = restaurantsAtAddressName.map((str: string) => stringSimilarity.compareTwoStrings(str, name))
    const score = Math.max(...nameSimilarities);

    const sortedResturants = restaurantsAtAddress.map(resturant => {
        return {
            ...resturant, 
            score: scoreRestaurantNameSimilarities(resturant.name, name)
        }
    }).sort((a, b) => b.score - a.score);
    
    if(sortedResturants[0].score > .75) {
 
        if(el) {
            el.innerHTML += `
            <span class="PFF-tooltip">
                <div class="PFF-kitchen-text PFF-ghost-free-text">Ghost-Free Kitchen</div>
                <div>✔️</div>
                <span class="PFF-tooltip-text">
                    <div class='PFF-max-content PFF-display-block'>
                        ${sortedResturants[0].name} confirmed to exixst at 
                        <a target='_blank' href='https://www.google.com/maps/place/${sortedResturants[0].vicinity}'>
                            this location
                        </a>
                    </div>
                </span>
            </span>
            `;
        }
        
    } else {
        if(el) {
            el.innerHTML += `
            <span class="PFF-tooltip">
                <div class="PFF-kitchen-text PFF-haunted-text">Haunted Kitchen</div>
                <div>👻</div>
                <span class="PFF-tooltip-text">
                    <span class='PFF-max-content PFF-display-block'>"${name}" not verified at
                        <a target='_blank' href='https://www.google.com/maps/place/${sortedResturants[0].vicinity}'>
                            this location.
                        </a>
                    </span>
                    <div class='PFF-mt-1 PFF-max-content'>
                        Other businesses at this location:
                    </div>
                    <ul>
                        ${sortedResturants.map(restaurant => `<li>${restaurant.name}</li>`).join('')}
                    </ul>
                </span>
            </span>`;
        }
    }

}

const checkForGhostKitchens = async () => {
    let cordinate = await getLatAndLong()
    let {latitude, longitude} = cordinate;

    // Leave for now to clear data when testing
    // await chrome.storage.local.clear();

    const cachedData = await getCachedRestaurantData(cordinate);
    if(cachedData) { 
        compareResturanttoResults(cachedData);
        return;
    }


    if (latitude && longitude) {
        chrome.runtime.sendMessage({ type: 'getNearbyRestaurants', cordinate: {latitude, longitude} }, async (response) => {
            compareResturanttoResults(response)
            // cache result for later
            await updateRestaurantCache(cordinate, response);
        });
    }
}

checkForGhostKitchens();
