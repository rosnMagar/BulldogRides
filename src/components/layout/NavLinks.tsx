import { NavLink as RouterNavLink, useLocation } from "react-router";
import { NavLink, Stack } from "@mantine/core";
import {
    IconHome,
    IconCar,
    IconThumbUp,
    IconList,
    IconLogout
} from "@tabler/icons-react";
import { useAuth } from "../../hooks/useAuth";

interface NavLinksProps {
    onNavigate?: () => void;
}

const navItems = [
    { label: "Home", path: "/", icon: IconHome },
    { label: "Offer Ride", path: "/offerRide", icon: IconCar },
    { label: "Request Ride", path: "/requestRide", icon: IconThumbUp },
    { label: "Browse Rides", path: "/rides", icon: IconList },
];

export default function NavLinks({ onNavigate }: NavLinksProps) {
    const location = useLocation();
    const { isDriver, signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        onNavigate?.();
    };

    return (
        <Stack gap={4}>
            {navItems.map((item) => {
                if (item.path === "/offerRide" && !isDriver) {
                    return null;
                }
                if (item.path === "/requestRide" && isDriver) {
                    return null;
                }
                return (
                    <NavLink
                        key={item.path}
                        component={RouterNavLink}
                        to={item.path}
                        label={item.label}
                        leftSection={<item.icon size={18} />}
                        active={location.pathname === item.path}
                        onClick={onNavigate}
                    />
                )
            })}
            <NavLink
                label="Logout"
                leftSection={<IconLogout size={18} />}
                onClick={handleLogout}
                c="red"
            />
        </Stack>
    );
}
