import { waitForElm } from './helpers';
import stringSimilarity from 'string-similarity';

export type Cordinate = {
    latitude: number
    longitude: number
}

// Not Needed
const getAddress = async (): Promise<string | undefined> => {
    const link: Element | null = 
        await waitForElm('a[href*="maps.google.com/maps"][href*="daddr"]');
  
    const href = link?.getAttribute('href');
    const splitHref = href?.split('daddr=');
    
    if(splitHref && splitHref.length > 1) {
        return splitHref[1]
    }
};

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

const compareResturanttoResults = async (results: any ) => {
    const scriptTag : any = 
        await waitForElm('script[type="application/ld+json"]');
    const data = JSON.parse(scriptTag.textContent);
    const address = data.address.streetAddress
    const name = data.name

    // const name = "Eamon's fake Resturant"

    const restaurantsAtAddress = results.restaurantName.filter((x: any) => x.vicinity.includes(address))

    
    compareNames(restaurantsAtAddress, name);

    console.log(data);
    console.log(address);
    console.log(name);
    console.log(results);
    console.log(results.restaurantName);
    console.log(restaurantsAtAddress);
}

const compareNames = (restaurantsAtAddress: any[], name: string) => {
    console.log(restaurantsAtAddress);
    const restaurantsAtAddressName = restaurantsAtAddress.map((x:any) => x.name);
    const nameSimilarities = restaurantsAtAddressName.map((str: string) => stringSimilarity.compareTwoStrings(str, name))
    const score = Math.max(...nameSimilarities);

    const sortedResturants = restaurantsAtAddress.map(resturant => {
        const score = stringSimilarity.compareTwoStrings(resturant.name, name);
        return { ...resturant, score }; 
      }).sort((a, b) => b.score - a.score);

    console.log(sortedResturants)
    
    const el = document.querySelector('h1');
    if(el) {
        el.style.display = 'flex'
        el.style.alignItems = 'center'

    }
    
    if(sortedResturants[0].score > .75) {
 
        if(el) {
            el.innerHTML += `
            <span class="PFF-tooltip">
                <div class="PFF-kitchen-text PFF-ghost-free-text">Ghost-Free Kitchen</div>
                <div>✔️</div>
                <span class="PFF-tooltip-text">
                    <div class='PFF-max-content PFF-display-block'>
                        ${sortedResturants[0].name} confirmed to exixst at 
                        <a target='_blank" href='https://www.google.com/maps/place/${sortedResturants[0].vicinity}'>
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
                        Other restaurants at location:
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
    let { latitude, longitude } = await getLatAndLong()

    if (latitude && longitude) {
        chrome.runtime.sendMessage({ type: 'getRestaurantName', cordinate: {latitude, longitude} }, (response) => {
            compareResturanttoResults(response)
        });
    }
}

checkForGhostKitchens();
