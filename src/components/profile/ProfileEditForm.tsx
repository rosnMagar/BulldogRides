import { useState, useEffect } from "react";
import {
    Container,
    Paper,
    Title,
    TextInput,
    Textarea,
    Button,
    Stack,
    Group,
    Alert,
    Text,
    Divider,
} from "@mantine/core";
import { useAuth } from "../../hooks/useAuth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";
import { useNavigate } from "react-router";

const client = generateClient<Schema>();

export default function ProfileEditForm() {
    const { user, isDriver } = useAuth();
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [bio, setBio] = useState("");
    const [vehicleDescription, setVehicleDescription] = useState("");

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || "");
            setLastName(user.lastName || "");
            setPhone(user.phone || "");
            setBio(user.bio || "");
            setVehicleDescription(user.vehicleDescription || "");
        }
    }, [user]);

    const handleSave = async () => {
        if (!user) return;

        setLoading(true);
        setSuccess(false);
        setError(null);

        try {
            const { errors } = await client.models.User.update({
                id: user.id,
                firstName,
                lastName,
                phone,
                bio,
                vehicleDescription: isDriver ? vehicleDescription : user.vehicleDescription,
            });

            if (errors) {
                throw new Error(errors[0].message);
            }

            setSuccess(true);
            setTimeout(() => {
                navigate("/");
            }, 1500);
        } catch (err: any) {
            console.error("Error updating profile:", err);
            setError(err.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <Text ta="center" py="xl">Loading profile...</Text>;
    }

    return (
        <Container size="sm" py="xl">
            <Paper withBorder shadow="md" p="xl" radius="md">
                <Title order={2} mb="xl" ta="center">Edit Profile</Title>

                {success && (
                    <Alert color="green" mb="md" title="Success!">
                        Profile updated successfully. Redirecting...
                    </Alert>
                )}

                {error && (
                    <Alert color="red" mb="md" title="Update Failed">
                        {error}
                    </Alert>
                )}

                <Stack gap="md">
                    <Group grow>
                        <TextInput
                            label="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.currentTarget.value)}
                            required
                        />
                        <TextInput
                            label="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.currentTarget.value)}
                            required
                        />
                    </Group>

                    <TextInput
                        label="Email"
                        value={user.email}
                        disabled
                        description="Email cannot be changed"
                    />

                    <TextInput
                        label="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.currentTarget.value)}
                        placeholder="e.g. (660) 123-4567"
                        required
                    />

                    <Textarea
                        label="Bio"
                        value={bio}
                        onChange={(e) => setBio(e.currentTarget.value)}
                        placeholder="Tell others about yourself..."
                        minRows={3}
                    />

                    {isDriver && (
                        <>
                            <Divider label="Driver Information" labelPosition="center" />
                            <Textarea
                                label="Vehicle Description"
                                value={vehicleDescription}
                                onChange={(e) => setVehicleDescription(e.currentTarget.value)}
                                placeholder="Describe your vehicle (Make, Model, Color)..."
                                description="This helps riders identify you"
                            />
                            <Alert color="blue" mt="xs">
                                <Text size="xs">
                                    Planned Feature: Vehicle photo upload with AI privacy protection.
                                </Text>
                            </Alert>
                        </>
                    )}

                    <Group justify="flex-end" mt="xl">
                        <Button variant="outline" color="gray" onClick={() => navigate("/")} disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} loading={loading}>
                            Save Changes
                        </Button>
                    </Group>
                </Stack>
            </Paper>
        </Container>
    );
}
