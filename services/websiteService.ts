
/**
 * Fetches the content of a given URL using a CORS proxy,
 * then cleans and extracts the text content from the HTML.
 * @param url The URL of the website to fetch.
 * @returns A promise that resolves to the cleaned text content of the page.
 */
export const fetchWebsiteContent = async (url: string): Promise<string> => {
    // Using a public CORS proxy to fetch content from the client side.
    // This is a workaround for the lack of a dedicated backend.
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch the URL. Status: ${response.status}`);
        }
        
        const html = await response.text();

        // A simple but effective way to extract text from HTML:
        // 1. Remove script and style blocks entirely.
        // 2. Remove all remaining HTML tags.
        // 3. Normalize whitespace.
        const cleanedText = html
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Truncate the content to a reasonable length to avoid hitting API token limits.
        const maxLength = 15000;
        return cleanedText.substring(0, maxLength);

    } catch (error) {
        console.error(`Error fetching website content from ${url}:`, error);
        throw new Error(`I was unable to access or process the content from the provided URL, Kaarthi.`);
    }
};
