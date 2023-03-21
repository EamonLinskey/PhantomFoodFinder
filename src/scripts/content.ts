import { waitForElm } from './helpers';
import stringSimilarity from 'string-similarity';

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

const compareResturanttoResults = async (results: any ) => {
    console.log('======')
    console.log(results)
    console.log(results.restaurantName.map((x: any) => x.name))

    const scriptTag : any = 
        await waitForElm('script[type="application/ld+json"]');
    console.log(scriptTag)
    const data = JSON.parse(scriptTag.textContent);
    console.log(data)
    const address = data.address.streetAddress
    console.log(address)
    const name = data.name
    console.log(name)

    // const name = "Eamon's fake Resturant"

    const restaurantsAtAddress = results.restaurantName.filter((x: any) => x.vicinity.includes(address))

    
    compareNames(restaurantsAtAddress, name, address);

    console.log(data);
    console.log(address);
    console.log(name);
    console.log(results);
    console.log(results.restaurantName);
    console.log(restaurantsAtAddress);
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
            <div class="PFF-kitchen-text PFF-haunted-text">Haunted Kitchen</div>
            <div>👻</div>
            <span class="PFF-tooltip-text">
                <span class='PFF-max-content PFF-display-block'> There are no resturants verified at
                    <a target='_blank' href='https://www.google.com/maps/place/${address}'>
                        this location.
                    </a>
                </span>
            </span>
        </span>`;
    }

    console.log(restaurantsAtAddress);
    const restaurantsAtAddressName = restaurantsAtAddress.map((x:any) => x.name);
    //TODO update compareTwoStrings  to better acccount for ampersand +'s or any other inconsistencies
    const nameSimilarities = restaurantsAtAddressName.map((str: string) => stringSimilarity.compareTwoStrings(str, name))
    const score = Math.max(...nameSimilarities);

    const sortedResturants = restaurantsAtAddress.map(resturant => {
        const score = stringSimilarity.compareTwoStrings(resturant.name, name);
        return { ...resturant, score }; 
      }).sort((a, b) => b.score - a.score);

    console.log(sortedResturants)
    console.log('SCORE')
    console.log(sortedResturants[0].score)
    
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
