interface Coordinates {
    lat: number;
    lng: number;
}

export async function getCoordinates(address: string): Promise<Coordinates | null> {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        { headers: { "User-Agent": "BulldogRides/1.0" } }
    );
    const data = await response.json();

    if (data.length === 0) {
        return null; // No results found
    }

    return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
    };
}
