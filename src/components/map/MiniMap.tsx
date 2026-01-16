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

        // Calculate distance between points (rough approximation in degrees)
        const latDiff = Math.abs(pickupLat - destinationLat);
        const lngDiff = Math.abs(pickupLng - destinationLng);
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

        // If points are very close together (within ~0.01 degrees, about 1km)
        if (distance < 0.01) {
            // Center on midpoint with a fixed reasonable zoom
            const centerLat = (pickupLat + destinationLat) / 2;
            const centerLng = (pickupLng + destinationLng) / 2;
            map.setView([centerLat, centerLng], 13);
        } else {
            // Fit bounds to show both markers
            const bounds = L.latLngBounds([
                [pickupLat, pickupLng],
                [destinationLat, destinationLng]
            ]);

            // Use fitBounds with padding and maxZoom to ensure both points are visible
            map.fitBounds(bounds, {
                padding: [60, 60],
                maxZoom: 13  // Prevent excessive zoom
            });
        }

        mapInstanceRef.current = map;

        // Fix for half-rendered map - multiple approaches
        // 1. Use whenReady event
        map.whenReady(() => {
            map.invalidateSize();
        });

        // 2. Add a delayed invalidation for animated containers
        setTimeout(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
            }
        }, 200);

        // 3. Add another one for slower renders
        setTimeout(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
            }
        }, 500);

        // 4. Handle tab visibility changes with IntersectionObserver
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && mapInstanceRef.current) {
                        // Map became visible, invalidate size
                        setTimeout(() => {
                            if (mapInstanceRef.current) {
                                mapInstanceRef.current.invalidateSize();
                            }
                        }, 50);
                    }
                });
            },
            { threshold: 0.1 }
        );

        if (mapRef.current) {
            observer.observe(mapRef.current);
        }

        return () => {
            observer.disconnect();
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
