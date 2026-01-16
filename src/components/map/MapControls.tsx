import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// Button configuration type
interface ControlButton {
    id: string;
    label: string;
    icon: string;
    backgroundColor: string;
    hoverColor: string;
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

// Modern button styles with smooth transitions
const buttonBaseStyle = `
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: all 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
                padding: 12px 18px;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(10px);
                border: none;
                border-radius: 10px;
                font-size: 14px;
                color: white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;

            container.innerHTML = `
                <span><strong>📍 Distance:</strong> ${formatDistance(routeInfo.distance)}</span>
                <span><strong>⏱️ Time:</strong> ${formatDuration(routeInfo.duration)}</span>
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
            const isMobile = window.innerWidth < 768;
            const isSmallMobile = window.innerWidth < 480;

            // Horizontal flexbox layout with wrapping for all screen sizes
            container.style.cssText = `
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                gap: ${isMobile ? '4px' : '10px'};
                background: transparent;
                border: none;
                box-shadow: none;
                max-width: ${isMobile ? '100%' : 'none'};
            `;

            // Modern button configurations with darker colors for better contrast on light maps
            const buttons: ControlButton[] = [
                {
                    id: "reset-pickup",
                    label: "Reset Pickup",
                    icon: "↺",
                    backgroundColor: "#5b21b6", // Deep purple
                    hoverColor: "#4c1d95",
                    onClick: onResetPickup,
                },
                {
                    id: "reset-destination",
                    label: "Reset Destination",
                    icon: "↺",
                    backgroundColor: "#dc2626", // Bold red
                    hoverColor: "#b91c1c",
                    onClick: onResetDestination,
                },
                {
                    id: "locate-me",
                    label: "Locate Me",
                    icon: "📍",
                    backgroundColor: "#0891b2", // Deep cyan
                    hoverColor: "#0e7490",
                    onClick: onLocateMe,
                },
            ];

            // Create buttons with responsive styling
            buttons.forEach((btn) => {
                const button = L.DomUtil.create("button", "", container);
                button.id = btn.id;

                // Always show full labels with icons
                button.innerHTML = `<span style="font-size: ${isSmallMobile ? '12px' : '16px'};">${btn.icon}</span><span>${btn.label}</span>`;

                // Compact responsive button styling for horizontal layout
                const responsiveStyle = buttonBaseStyle + `
                    background: ${btn.backgroundColor};
                    padding: ${isSmallMobile ? '6px 8px' : isMobile ? '8px 10px' : '10px 16px'};
                    font-size: ${isSmallMobile ? '10px' : isMobile ? '11px' : '14px'};
                    gap: ${isSmallMobile ? '3px' : isMobile ? '4px' : '8px'};
                    white-space: nowrap;
                    flex-shrink: 0;
                `;

                button.style.cssText = responsiveStyle;

                // Hover effects
                button.onmouseenter = () => {
                    button.style.background = btn.hoverColor;
                    button.style.transform = "translateY(-2px)";
                    button.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
                };
                button.onmouseleave = () => {
                    button.style.background = btn.backgroundColor;
                    button.style.transform = "translateY(0)";
                    button.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
                };

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

        // Re-render on window resize for responsiveness
        const handleResize = () => {
            control.remove();
            const newControl = new L.Control({ position: "bottomright" });
            newControl.onAdd = control.onAdd;
            newControl.addTo(map);
        };

        let resizeTimeout: NodeJS.Timeout;
        const debouncedResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleResize, 250);
        };

        window.addEventListener('resize', debouncedResize);

        return () => {
            window.removeEventListener('resize', debouncedResize);
            clearTimeout(resizeTimeout);
            control.remove();
        };
    }, [map, onResetPickup, onResetDestination, onLocateMe]);

    return null;
}
