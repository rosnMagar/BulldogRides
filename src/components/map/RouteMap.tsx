import L, { type LatLng } from "leaflet"
import "leaflet/dist/leaflet.css"
import { useEffect, useState, useCallback } from "react"
import { useMapEvents, MapContainer, TileLayer, Marker, useMap } from "react-leaflet"
import { getRoute, type RouteResult } from "../../services/routeService";
import { Polyline } from "react-leaflet";
import { pickupIcon, destinationIcon } from "../../services/mapIconService";
import MapControls from "./MapControls";

interface RouteMapProps {
    label?: string;
    onPickupSelect?: (lat: number, lng: number) => void;
    onDestinationSelect?: (lat: number, lng: number) => void;
    onPickupReset?: () => void;
    onDestinationReset?: () => void;
    initialPosition?: [number, number];
    // External coordinates from form state (e.g. from address autocomplete)
    pickupLat?: number;
    pickupLng?: number;
    destinationLat?: number;
    destinationLng?: number;
}

export default function RouteMap({
    label,
    onPickupSelect,
    onDestinationSelect,
    onPickupReset,
    onDestinationReset,
    initialPosition = [40.1948, -92.5832], // Default to Truman
    pickupLat,
    pickupLng,
    destinationLat,
    destinationLng
}: RouteMapProps) {

    const [pickupMarkerPosition, setPickupMarkerPosition] = useState<LatLng | null>(null);
    const [pickupSelected, setPickupSelected] = useState(false);
    const [destinationMarkerPosition, setDestinationMarkerPosition] = useState<LatLng | null>(null);
    const [destinationSelected, setDestinationSelected] = useState(false);
    const [route, setRoute] = useState<RouteResult | null>(null);

    // Sync external coordinates with map markers
    useEffect(() => {
        if (pickupLat !== undefined && pickupLng !== undefined) {
            const latlng = L.latLng(pickupLat, pickupLng);
            setPickupMarkerPosition(latlng);
            setPickupSelected(true);
        }
    }, [pickupLat, pickupLng]);

    useEffect(() => {
        if (destinationLat !== undefined && destinationLng !== undefined) {
            const latlng = L.latLng(destinationLat, destinationLng);
            setDestinationMarkerPosition(latlng);
            setDestinationSelected(true);
        }
    }, [destinationLat, destinationLng]);

    const resetPickup = useCallback(() => {
        setPickupMarkerPosition(null);
        setPickupSelected(false);
        onPickupReset?.();
    }, [onPickupReset]);

    const resetDestination = useCallback(() => {
        setDestinationMarkerPosition(null);
        setDestinationSelected(false);
        onDestinationReset?.();
    }, [onDestinationReset]);

    const handleLocateMe = useCallback(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latlng = L.latLng(position.coords.latitude, position.coords.longitude);
                setPickupMarkerPosition(latlng);
                setPickupSelected(true);
                onPickupSelect?.(latlng.lat, latlng.lng);
            },
            (error) => {
                console.error("Geolocation error:", error);
                alert("Could not get your location. Please enable location services.");
            }
        );
    }, [onPickupSelect]);

    // Fetch route when both markers are set
    useEffect(() => {
        const fetchRoute = async () => {
            if (pickupMarkerPosition && destinationMarkerPosition) {
                try {
                    const routeResult = await getRoute(
                        {
                            latitude: pickupMarkerPosition.lat,
                            longitude: pickupMarkerPosition.lng
                        },
                        {
                            latitude: destinationMarkerPosition.lat,
                            longitude: destinationMarkerPosition.lng
                        }
                    );
                    setRoute(routeResult);
                } catch (error) {
                    console.error("Failed to get route:", error);
                    setRoute(null);
                }
            } else {
                setRoute(null);
            }
        };

        fetchRoute();
    }, [pickupMarkerPosition, destinationMarkerPosition]);

    // Handle map click events
    function ClickHandler() {
        const map = useMapEvents({
            click(e) {
                if (!pickupSelected) {
                    setPickupMarkerPosition(e.latlng);
                    onPickupSelect?.(e.latlng.lat, e.latlng.lng);
                    setPickupSelected(true);
                } else if (!destinationSelected) {
                    setDestinationMarkerPosition(e.latlng);
                    onDestinationSelect?.(e.latlng.lat, e.latlng.lng);
                    setDestinationSelected(true);
                }
            },
            locationfound(e) {
                map.flyTo(e.latlng, map.getZoom());
            },
        });

        // Center on user's location when map loads
        useEffect(() => {
            if (!pickupMarkerPosition && !destinationMarkerPosition) {
                map.locate();
            }
        }, [map]);

        return null;
    }

    // Component to adjust map view based on markers
    function FitBoundsHandler() {
        const map = useMap();

        useEffect(() => {
            if (pickupMarkerPosition && destinationMarkerPosition) {
                // Fit to show both markers when route is ready
                const bounds = L.latLngBounds([pickupMarkerPosition, destinationMarkerPosition]);
                map.fitBounds(bounds, { padding: [50, 50] });
            } else if (pickupMarkerPosition && !destinationMarkerPosition) {
                // Just fly to pickup if destination not set yet
                map.flyTo(pickupMarkerPosition, 16);
            }
        }, [map, pickupMarkerPosition, destinationMarkerPosition]);

        return null;
    }

    return (
        <div style={{ marginBottom: "1rem" }}>
            {label && <label style={{ fontWeight: 500, marginBottom: 4, display: "block" }}>{label}</label>}

            <MapContainer
                center={initialPosition}
                zoom={15}
                scrollWheelZoom={true}
                style={{ height: "500px", width: "100%", borderRadius: "8px" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ClickHandler />
                <FitBoundsHandler />
                <MapControls
                    onResetPickup={resetPickup}
                    onResetDestination={resetDestination}
                    onLocateMe={handleLocateMe}
                    routeInfo={route ? { distance: route.distance, duration: route.duration } : null}
                />
                {pickupMarkerPosition && <Marker position={pickupMarkerPosition} icon={pickupIcon} />}
                {destinationMarkerPosition && <Marker position={destinationMarkerPosition} icon={destinationIcon} />}
                {route && <Polyline pathOptions={{ color: "black", weight: 5 }} positions={route.coordinates} />}
            </MapContainer>
        </div>
    )
}