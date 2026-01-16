/**
 * Geocoding Service using OpenStreetMap Nominatim API
 * 
 * Features:
 * - Forward geocoding: address string → coordinates
 * - Reverse geocoding: coordinates → address string
 * - Rate limiting (max 1 req/sec per Nominatim policy)
 * - Smart caching with 1-hour TTL
 * - Request deduplication
 * - Limit to top 5 results for efficiency
 */

export interface GeocodingResult {
    lat: number;
    lng: number;
    displayName: string;
    address: {
        house_number?: string;
        road?: string;
        city?: string;
        state?: string;
        postcode?: string;
        country?: string;
    };
}

// Nominatim API response format
interface NominatimResult {
    lat: string;
    lon: string;
    display_name: string;
    address?: {
        house_number?: string;
        road?: string;
        city?: string;
        state?: string;
        postcode?: string;
        country?: string;
    };
}

// Cache for geocoding results (1 hour TTL)
interface CacheEntry {
    result: GeocodingResult | GeocodingResult[];
    timestamp: number;
}

const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
const cache = new Map<string, CacheEntry>();

// Rate limiting: max 1 request per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

// Track in-flight requests to prevent duplicates
const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Wait to respect rate limit (1 req/sec)
 */
async function respectRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastRequestTime = Date.now();
}

/**
 * Get cached result if available and not expired
 */
function getCached<T>(key: string): T | null {
    const cached = cache.get(key);

    if (!cached) {
        return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > CACHE_TTL) {
        cache.delete(key);
        return null;
    }

    return cached.result as T;
}

/**
 * Store result in cache
 */
function setCache(key: string, result: GeocodingResult | GeocodingResult[]): void {
    cache.set(key, {
        result,
        timestamp: Date.now()
    });

    // Simple LRU: keep cache size under 100 entries
    if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        if (firstKey) {
            cache.delete(firstKey);
        }
    }
}

/**
 * Transform Nominatim result to our format
 */
function transformNominatimResult(result: NominatimResult): GeocodingResult {
    return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name,
        address: {
            house_number: result.address?.house_number,
            road: result.address?.road,
            city: result.address?.city,
            state: result.address?.state,
            postcode: result.address?.postcode,
            country: result.address?.country
        }
    };
}

/**
 * Forward Geocoding: Convert address string to coordinates
 * 
 * @param address - Address string (e.g., "123 Main St, Kirksville, MO")
 * @returns Array of up to 5 matching locations
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult[]> {
    if (!address || address.trim().length < 5) {
        console.log('[Geocoding] Address too short, skipping:', address);
        return [];
    }

    const cacheKey = `forward:${address.toLowerCase().trim()}`;

    // Check cache first
    const cached = getCached<GeocodingResult[]>(cacheKey);
    if (cached) {
        console.log('[Geocoding] Cache hit for:', address);
        return cached;
    }

    // Check if request is already in-flight
    if (inFlightRequests.has(cacheKey)) {
        console.log('[Geocoding] Request already in-flight for:', address);
        return inFlightRequests.get(cacheKey)!;
    }

    // Create new request
    const requestPromise = (async () => {
        try {
            console.log('[Geocoding] Querying API for:', address);
            await respectRateLimit();

            const params = new URLSearchParams({
                q: address,
                format: 'json',
                addressdetails: '1',
                limit: '5' // Only get top 5 results
            });

            const url = `https://nominatim.openstreetmap.org/search?${params}`;
            console.log('[Geocoding] API URL:', url);

            const response = await fetch(
                url,
                {
                    headers: {
                        'User-Agent': 'BulldogRides/1.0' // Required by Nominatim
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Geocoding failed: ${response.statusText}`);
            }

            const data: NominatimResult[] = await response.json();
            console.log('[Geocoding] API returned results:', data.length);
            const results = data.map(transformNominatimResult);

            // Cache the results
            setCache(cacheKey, results);

            return results;
        } catch (error) {
            console.error('[Geocoding] Error:', error);
            throw error;
        } finally {
            // Remove from in-flight requests
            inFlightRequests.delete(cacheKey);
        }
    })();

    // Store in-flight request
    inFlightRequests.set(cacheKey, requestPromise);

    return requestPromise;
}

/**
 * Reverse Geocoding: Convert coordinates to address string
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Address information for the location
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
    const cacheKey = `reverse:${lat.toFixed(6)},${lng.toFixed(6)}`;

    // Check cache first
    const cached = getCached<GeocodingResult>(cacheKey);
    if (cached) {
        return cached;
    }

    // Check if request is already in-flight
    if (inFlightRequests.has(cacheKey)) {
        return inFlightRequests.get(cacheKey)!;
    }

    // Create new request
    const requestPromise = (async () => {
        try {
            await respectRateLimit();

            const params = new URLSearchParams({
                lat: lat.toString(),
                lon: lng.toString(),
                format: 'json',
                addressdetails: '1'
            });

            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?${params}`,
                {
                    headers: {
                        'User-Agent': 'BulldogRides/1.0'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Reverse geocoding failed: ${response.statusText}`);
            }

            const data: NominatimResult = await response.json();
            const result = transformNominatimResult(data);

            // Cache the result
            setCache(cacheKey, result);

            return result;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            throw error;
        } finally {
            // Remove from in-flight requests
            inFlightRequests.delete(cacheKey);
        }
    })();

    // Store in-flight request
    inFlightRequests.set(cacheKey, requestPromise);

    return requestPromise;
}

/**
 * Clear the geocoding cache (useful for testing or memory management)
 */
export function clearGeocodingCache(): void {
    cache.clear();
}
