import {PFFBadgeId} from './HTMLelements';
import {BadgeType, GooglePlaceRestaurant, PageRestaurantData} from './types';

const badgeMap = new Map(
	Object.entries({
		confirmedGhostKitchen: {
			emoji: '👻',
			badgeClass: 'PFF-haunted-text',
			badgeText: 'Haunted Kitchen'
		},
		confirmedRealKitchen: {
			emoji: '✔️',
			badgeClass: 'PFF-ghost-free-text',
			badgeText: 'Ghost-Free Kitchen'
		},
		unconfirmedKitchen: {
			emoji: '❓',
			badgeClass: 'PFF-potentially-haunted-text',
			badgeText: 'Unverified'
		}
	})
);

// All of the major websites we tried had the restaurant anem on an H1 tag at the top of the page,
// so we use that as the default target
export const AddBadgeHTMLtoTarget = (
	restaurants: GooglePlaceRestaurant[],
	badgeType: BadgeType,
	pageData: PageRestaurantData,
	target: string = 'h1'
): void => {
	const elment: HTMLHeadingElement = document.querySelector(target);
	if (!elment) {
		return;
	}

	// Update the style to place badge nicely
	elment.style.display = 'flex';
	elment.style.alignItems = 'center';

	const {emoji, badgeClass, badgeText} = badgeMap.get(badgeType);

	const address = restaurants.length > 0 ? restaurants[0].vicinity : pageData.address.streetAddress;

	const link = `https://www.google.com/maps/place/${address}`;

	// Build Tooltip
	let tooltipContent;
	if (badgeType === 'confirmedRealKitchen') {
		tooltipContent = `
            ${restaurants[0].name} confirmed to exixst at 
            <a target='_blank' href='${link}'>
                this location
            </a>`;
	} else if (badgeType === 'confirmedGhostKitchen') {
		tooltipContent = `
            "${pageData.name}" not verified at
            <a target='_blank' href='${link}'>
                this location.
            </a>
            </span>
            <div class='PFF-mt-1 PFF-max-content'>
                Other businesses at this location:
            </div>
            <ul>
                ${restaurants.map((restaurant) => `<li>${restaurant.name}</li>`).join('')}
            </ul>`;
	} else {
		tooltipContent = `
            There are no resturants verified at
            <a target='_blank' href='${link}'>
                this location.
            </a>
            <div>This may be due to google maps data not being up to date</div>
            <div>or the address data may be incorrect</div>
            `;
	}

	// Add badge to page
	elment.innerHTML += `
        <span class="PFF-tooltip">
            <div id='${PFFBadgeId}' class="PFF-kitchen-text ${badgeClass}">${badgeText}</div>
            <div  class="PFF-kitchen-emoji">${emoji}</div>
            <span class="PFF-tooltip-text">
                <span class='PFF-max-content PFF-display-block'> 
                    ${tooltipContent}
                </span>
            </span>
        </span>`;
};
