import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { pickupIconSmall, destinationIconSmall } from "../../services/mapIconService";

interface MiniMapProps {
    pickupLat: number;
    pickupLng: number;
    destinationLat: number;
    destinationLng: number;
    height?: number;
}

export default function MiniMap({
    pickupLat,
    pickupLng,
    destinationLat,
    destinationLng,
    height = 150
}: MiniMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // Create map with interactions disabled
        const map = L.map(mapRef.current, {
            zoomControl: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            dragging: false,
            touchZoom: false,
            keyboard: false,
            boxZoom: false,
            attributionControl: false,
        });

        // Add OSM tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 18,
        }).addTo(map);

        // Add markers with popups
        L.marker([pickupLat, pickupLng], { icon: pickupIconSmall })
            .bindPopup("Pickup")
            .addTo(map);

        L.marker([destinationLat, destinationLng], { icon: destinationIconSmall })
            .bindPopup("Destination")
            .addTo(map);

        // Fit bounds to show both markers
        const bounds = L.latLngBounds([
            [pickupLat, pickupLng],
            [destinationLat, destinationLng]
        ]);
        map.fitBounds(bounds, { padding: [20, 20] });

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [pickupLat, pickupLng, destinationLat, destinationLng]);

    return (
        <div
            ref={mapRef}
            style={{
                height: `${height}px`,
                width: "100%",
                borderRadius: "8px",
                overflow: "hidden"
            }}
        />
    );
}
