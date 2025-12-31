import L, { type LatLng } from "leaflet"
import "leaflet/dist/leaflet.css"
import { useEffect, useState } from "react"
import { useMapEvents, MapContainer, TileLayer, Marker, useMap } from "react-leaflet"
import { getRoute } from "../../services/routeService";
import { type RouteResult } from "../../services/routeService";
import { Polyline } from "react-leaflet";

// Custom colored marker icons
const pickupIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface RouteMapProps {
    label?: string;
    onPickupSelect?: (lat: number, lng: number) => void;
    onDestinationSelect?: (lat: number, lng: number) => void;
    onPickupReset?: () => void;
    onDestinationReset?: () => void;
    initialPosition?: [number, number];
}

export default function RouteMap(
    { label,
        onPickupSelect,
        onDestinationSelect,
        onPickupReset,
        onDestinationReset,
        initialPosition = [40.1948, -92.5832] // Default to Truman
    }: RouteMapProps) {

    const [pickupMarkerPosition, setPickupMarkerPosition] = useState<LatLng | null>(null);
    const [pickupSelected, setPickupSelected] = useState(false);
    const [destinationMarkerPosition, setDestinationMarkerPosition] = useState<LatLng | null>(null);
    const [destinationSelected, setDestinationSelected] = useState(false);
    const [route, setRoute] = useState<RouteResult | null>(null);

    const resetPickup = () => {
        setPickupMarkerPosition(null);
        setPickupSelected(false);
        onPickupReset?.();
    };

    const resetDestination = () => {
        setDestinationMarkerPosition(null);
        setDestinationSelected(false);
        onDestinationReset?.();
    };

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

    // Custom Leaflet control for reset buttons
    function MapControls() {
        const map = useMap();

        useEffect(() => {
            const control = new L.Control({ position: "bottomright" });

            control.onAdd = () => {
                const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
                container.style.cssText = "display: flex; flex-direction: row; gap: 8px; background: transparent; border: none; box-shadow: none;";

                const pickupBtn = L.DomUtil.create("button", "", container);
                pickupBtn.innerHTML = "🔄 Reset Pickup";
                pickupBtn.style.cssText = "padding: 10px 16px; font-size: 13px; font-weight: 500; white-space: nowrap; background: #333; color: white; border: none; border-radius: 6px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.3);";
                pickupBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    resetPickup();
                };

                const destBtn = L.DomUtil.create("button", "", container);
                destBtn.innerHTML = "🔄 Reset Destination";
                destBtn.style.cssText = "padding: 10px 16px; font-size: 13px; font-weight: 500; white-space: nowrap; background: #c0392b; color: white; border: none; border-radius: 6px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.3);";
                destBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    resetDestination();
                };

                const locateBtn = L.DomUtil.create("button", "", container);
                locateBtn.innerHTML = "📍 Locate Me";
                locateBtn.style.cssText = "padding: 10px 16px; font-size: 13px; font-weight: 500; white-space: nowrap; background: #2980b9; color: white; border: none; border-radius: 6px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.3);";
                locateBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const latlng = L.latLng(position.coords.latitude, position.coords.longitude);
                            map.flyTo(latlng, 16);
                            setPickupMarkerPosition(latlng);
                            setPickupSelected(true);
                            onPickupSelect?.(latlng.lat, latlng.lng);
                        },
                        (error) => {
                            console.error("Geolocation error:", error);
                            alert("Could not get your location. Please enable location services.");
                        }
                    );
                };

                // Prevent map interactions when clicking the control
                L.DomEvent.disableClickPropagation(container);
                L.DomEvent.disableScrollPropagation(container);

                return container;
            };

            control.addTo(map);
            return () => {
                control.remove();
            };
        }, [map]);

        return null;
    }

    function ClickHandler() {
        const map = useMapEvents({
            click(e) {
                if (!pickupSelected) {
                    setPickupMarkerPosition(e.latlng);
                    onPickupSelect && onPickupSelect(e.latlng.lat, e.latlng.lng);
                    setPickupSelected(true);
                } else if (!destinationSelected) {
                    setDestinationMarkerPosition(e.latlng);
                    onDestinationSelect && onDestinationSelect(e.latlng.lat, e.latlng.lng);
                    setDestinationSelected(true);
                }
            },
            locationfound(e) {
                map.flyTo(e.latlng, map.getZoom());
            },
        });

        // Center on user's location when map loads
        if (!pickupMarkerPosition && !destinationMarkerPosition) {
            map.locate();
        }

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
                <MapControls />
                {pickupMarkerPosition && <Marker position={pickupMarkerPosition} icon={pickupIcon} />}
                {destinationMarkerPosition && <Marker position={destinationMarkerPosition} icon={destinationIcon} />}
                {route && <Polyline pathOptions={{ color: "black", weight: 5 }} positions={route.coordinates} />}
            </MapContainer>
        </div>
    )
}