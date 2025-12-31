export interface RouteResult {
    coordinates: [number, number][]; // [lat, lng] format for Leaflet
    distance: number;  // in meters
    duration: number;  // in seconds
}

export async function getRoute(
    pickup: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
): Promise<RouteResult> {
    const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickup.longitude},${pickup.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`
    );
    const data = await response.json();

    if (data.code !== "Ok" || !data.routes?.length) {
        throw new Error("Failed to get route");
    }

    // OSRM returns [lng, lat], but Leaflet expects [lat, lng]
    const coordinates = data.routes[0].geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
    );

    return {
        coordinates,
        distance: data.routes[0].distance,
        duration: data.routes[0].duration
    };
}