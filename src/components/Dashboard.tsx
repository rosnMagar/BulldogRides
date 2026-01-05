import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useUserRides } from "../hooks/useUserRides";
import RideCard from "./RideList/RideCard";
import {
    Container,
    Title,
    Text,
    Paper,
    Avatar,
    Stack,
    Group,
    Button,
    Tabs,
    Badge,
    Grid,
    Loader,
    SimpleGrid,
} from "@mantine/core";
import { IconUser, IconCalendar, IconHistory, IconChartBar } from "@tabler/icons-react";

export default function Dashboard() {
    const { user, isDriver } = useAuth();
    const { rides, loading } = useUserRides();
    const navigate = useNavigate();

    const now = new Date();
    const upcomingRides = rides.all.filter(r => new Date(r.pickupTime) > now && r.status !== 'CANCELLED');
    const pastRides = rides.all.filter(r => new Date(r.pickupTime) <= now || r.status === 'CANCELLED');

    const stats = {
        offered: rides.asCreator.filter(r => r.type === 'OFFER').length,
        requested: rides.asCreator.filter(r => r.type === 'REQUEST').length,
        joined: rides.asPassenger.length,
    };

    if (loading) {
        return (
            <Container size="sm" py="xl">
                <Stack align="center">
                    <Loader size="xl" />
                    <Text c="dimmed">Loading your dashboard...</Text>
                </Stack>
            </Container>
        );
    }

    return (
        <Container size="md" py="xl">
            <Title order={2} mb="xl">My Dashboard</Title>

            <Grid gutter="lg">
                {/* Left Column: Profile & Stats */}
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Stack gap="lg">
                        <Paper withBorder p="xl" radius="md" shadow="sm">
                            <Stack align="center" gap="md">
                                <Avatar
                                    size={80}
                                    radius={80}
                                    color="violet"
                                    src={user?.profilePicture}
                                >
                                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                                </Avatar>
                                <Stack gap={2} align="center">
                                    <Text fw={700} size="lg">
                                        {user?.firstName} {user?.lastName}
                                    </Text>
                                    <Badge variant="light" color={isDriver ? "blue" : "green"}>
                                        {isDriver ? "Driver Mode" : "Rider Mode"}
                                    </Badge>
                                </Stack>

                                <Text size="sm" c="dimmed" ta="center" lineClamp={3}>
                                    {user?.bio || "No bio added yet."}
                                </Text>

                                <Button
                                    variant="light"
                                    fullWidth
                                    leftSection={<IconUser size={16} />}
                                    onClick={() => navigate("/profile")}
                                >
                                    Edit Profile
                                </Button>
                            </Stack>
                        </Paper>

                        <Paper withBorder p="md" radius="md">
                            <Group gap="xs" mb="sm">
                                <IconChartBar size={20} />
                                <Text fw={600}>Statistics</Text>
                            </Group>
                            <SimpleGrid cols={1}>
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Rides Offered</Text>
                                    <Text fw={700}>{stats.offered}</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Rides Joined</Text>
                                    <Text fw={700}>{stats.joined}</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Ride Requests</Text>
                                    <Text fw={700}>{stats.requested}</Text>
                                </Group>
                            </SimpleGrid>
                        </Paper>

                        {isDriver && user?.vehicleDescription && (
                            <Paper withBorder p="md" radius="md">
                                <Text fw={600} size="sm" mb="xs">My Vehicle</Text>
                                <Text size="sm">{user.vehicleDescription}</Text>
                            </Paper>
                        )}
                    </Stack>
                </Grid.Col>

                {/* Right Column: Ride Lists */}
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Tabs defaultValue="upcoming">
                        <Tabs.List mb="md">
                            <Tabs.Tab value="upcoming" leftSection={<IconCalendar size={16} />}>
                                Upcoming ({upcomingRides.length})
                            </Tabs.Tab>
                            <Tabs.Tab value="past" leftSection={<IconHistory size={16} />}>
                                Past ({pastRides.length})
                            </Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="upcoming">
                            {upcomingRides.length === 0 ? (
                                <Paper withBorder p="xl" radius="md" ta="center">
                                    <Text c="dimmed">No upcoming rides scheduled.</Text>
                                    <Button
                                        variant="subtle"
                                        mt="md"
                                        onClick={() => navigate("/rides")}
                                    >
                                        Find a Ride
                                    </Button>
                                </Paper>
                            ) : (
                                <Stack gap="md">
                                    {upcomingRides.map(ride => (
                                        <RideCard key={ride.id} ride={ride} isDriver={isDriver} />
                                    ))}
                                </Stack>
                            )}
                        </Tabs.Panel>

                        <Tabs.Panel value="past">
                            {pastRides.length === 0 ? (
                                <Text c="dimmed" ta="center" py="xl">No ride history yet.</Text>
                            ) : (
                                <Stack gap="md">
                                    {pastRides.map(ride => (
                                        <RideCard key={ride.id} ride={ride} isDriver={isDriver} />
                                    ))}
                                </Stack>
                            )}
                        </Tabs.Panel>
                    </Tabs>
                </Grid.Col>
            </Grid>
        </Container>
    );
}
