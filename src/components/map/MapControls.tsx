import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// Button configuration type
interface ControlButton {
    id: string;
    label: string;
    backgroundColor: string;
    onClick: () => void;
}

interface RouteInfo {
    distance: number;  // meters
    duration: number;  // seconds
}

interface MapControlsProps {
    onResetPickup: () => void;
    onResetDestination: () => void;
    onLocateMe: () => void;
    routeInfo?: RouteInfo | null;
}

// Shared button styles
const buttonBaseStyle = `
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
`;

// Format helpers
function formatDistance(meters: number): string {
    const miles = meters / 1609.344;
    return miles >= 0.1 ? `${miles.toFixed(1)} mi` : `${Math.round(meters * 3.281)} ft`;
}

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
}

export default function MapControls({
    onResetPickup,
    onResetDestination,
    onLocateMe,
    routeInfo
}: MapControlsProps) {
    const map = useMap();

    // Route info control (top left)
    useEffect(() => {
        if (!routeInfo) return;

        const infoControl = new L.Control({ position: "topright" });

        infoControl.onAdd = () => {
            const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
            container.style.cssText = `
                display: flex;
                gap: 1rem;
                padding: 10px 16px;
                background: rgba(0, 0, 0, 0.8);
                border: none;
                border-radius: 6px;
                font-size: 14px;
                color: white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            `;

            container.innerHTML = `
                <span><strong>Distance:</strong> ${formatDistance(routeInfo.distance)}</span>
                <span><strong>Time:</strong> ${formatDuration(routeInfo.duration)}</span>
            `;

            L.DomEvent.disableClickPropagation(container);
            return container;
        };

        infoControl.addTo(map);
        return () => {
            infoControl.remove();
        };
    }, [map, routeInfo]);

    // Button controls (bottom right)
    useEffect(() => {
        const control = new L.Control({ position: "bottomright" });

        control.onAdd = () => {
            const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
            container.style.cssText = "display: flex; flex-direction: row; gap: 8px; background: transparent; border: none; box-shadow: none;";

            // Button configurations
            const buttons: ControlButton[] = [
                {
                    id: "reset-pickup",
                    label: "Reset Pickup",
                    backgroundColor: "#333",
                    onClick: onResetPickup,
                },
                {
                    id: "reset-destination",
                    label: "Reset Destination",
                    backgroundColor: "#c0392b",
                    onClick: onResetDestination,
                },
                {
                    id: "locate-me",
                    label: "Locate Me",
                    backgroundColor: "#2980b9",
                    onClick: onLocateMe,
                },
            ];

            // Create buttons from config
            buttons.forEach((btn) => {
                const button = L.DomUtil.create("button", "", container);
                button.id = btn.id;
                button.innerHTML = btn.label;
                button.style.cssText = buttonBaseStyle + `background: ${btn.backgroundColor};`;
                button.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    btn.onClick();
                };
            });

            // Prevent map interactions when clicking the control
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);

            return container;
        };

        control.addTo(map);
        return () => {
            control.remove();
        };
    }, [map, onResetPickup, onResetDestination, onLocateMe]);

    return null;
}
