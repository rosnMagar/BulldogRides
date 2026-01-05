import { Card, Text, Group, Stack, Avatar, ThemeIcon } from "@mantine/core";
import { IconUser, IconCar } from "@tabler/icons-react";
import type { Schema } from "../../../amplify/data/resource";

type User = Schema["User"]["type"];

interface PersonCardProps {
    title: string;
    person: User | null;
    variant: "creator" | "driver";
    emptyText?: string;
}

export default function PersonCard({ title, person, variant, emptyText }: PersonCardProps) {
    const icon = variant === "driver" ? <IconCar size={18} /> : <IconUser size={18} />;
    const color = variant === "driver" ? "green" : "gray";
    const avatarColor = variant === "driver" ? "green" : "blue";

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Group gap="sm" mb="sm">
                <ThemeIcon color={color} size="lg" radius="xl" variant="light">
                    {icon}
                </ThemeIcon>
                <Text fw={500}>{title}</Text>
            </Group>
            {person ? (
                <Group>
                    <Avatar color={avatarColor} radius="xl" size="md">
                        {person.firstName?.[0]}{person.lastName?.[0]}
                    </Avatar>
                    <Stack gap={0}>
                        <Text fw={500}>{person.firstName} {person.lastName}</Text>
                        <Text size="sm" c="dimmed">{person.email}</Text>
                    </Stack>
                </Group>
            ) : (
                <Text c="dimmed">{emptyText || "Unknown"}</Text>
            )}
        </Card>
    );
}
