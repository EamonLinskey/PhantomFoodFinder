// Look for an element on a page if exists or watch until it loads
export const waitForElm = (selector: string): Promise<Element | null> => {
    return new Promise((resolve: (value: Element | PromiseLike<Element | null> | null) => void) => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(() => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

export const PFFBadgeId = 'PPF-badge'
export const hasPFFBadge = () => {
    return document.querySelector(`#${PFFBadgeId}`) !== null;
};