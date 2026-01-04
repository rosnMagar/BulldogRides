import { Outlet, useNavigate } from "react-router";
import { AppShell, Avatar, Burger, Group, Switch, Title, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import NavLinks from "./NavLinks";
import NotificationBell from "../notifications/NotificationBell";
import NotificationDrawer from "../notifications/NotificationDrawer";
import { useAuth } from "../../hooks/useAuth";
import { IconUser, IconSteeringWheel } from "@tabler/icons-react";

export default function AppLayout() {
    const [opened, { toggle, close }] = useDisclosure();
    const [notificationsOpened, { open: openNotifications, close: closeNotifications }] = useDisclosure();
    const { user, isDriver, toggleMode } = useAuth();
    const navigate = useNavigate();

    const handleOnModeChange = () => {
        toggleMode();
        navigate("/");
        close();
    };

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 250,
                breakpoint: "sm",
                collapsed: { mobile: !opened },
            }}
            padding="xs"
        >
            <AppShell.Header style={{ zIndex: 1100 }}>
                <Group h="100%" px="md" justify="space-between">
                    <Group>
                        <Burger
                            opened={opened}
                            onClick={toggle}
                            hiddenFrom="sm"
                            size="sm"
                        />
                        <Title order={3}>Bulldog Rides</Title>
                    </Group>
                    <Group style={{ zIndex: 99999 }}>
                        <Tooltip label={isDriver ? "Driver Mode" : "Rider Mode"} refProp="rootRef">
                            <Switch
                                size="lg"
                                color="dark"
                                checked={isDriver}
                                onChange={handleOnModeChange}
                                onLabel={<IconSteeringWheel size={20} stroke={2.5} color="var(--mantine-color-blue-6)" />}
                                offLabel={<IconUser size={20} stroke={2.5} color="var(--mantine-color-yellow-4)" />}
                            />
                        </Tooltip>
                        <NotificationBell onClick={openNotifications} />
                        {user && (
                            <Group>
                                <Avatar
                                    size="md"
                                    radius="md"
                                    color="violet"
                                >
                                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                                </Avatar>
                            </Group>
                        )}
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md" style={{ zIndex: 1100 }}>
                <NavLinks onNavigate={close} />
            </AppShell.Navbar>

            <AppShell.Main>
                <Outlet />
            </AppShell.Main>

            <NotificationDrawer
                opened={notificationsOpened}
                onClose={closeNotifications}
            />
        </AppShell>
    );
}
