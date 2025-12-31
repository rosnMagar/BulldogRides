export async function getAddress(lat: number, lng: number): Promise<string> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { "User-Agent": "BulldogRides/1.0" } }
        );

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        return data.display_name ?? "Unknown location";
    } catch (error) {
        console.error("Geocoding failed:", error);
        return "Unable to fetch address";
    }
}