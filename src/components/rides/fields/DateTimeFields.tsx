import { Group } from "@mantine/core";
import { DateInput, TimeInput } from "@mantine/dates";

// Constants
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface DateTimeFieldsProps {
    date: string | null;
    onDateChange: (date: string | null) => void;
    time: string;
    onTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    timeError: string | null;
}

export default function DateTimeFields({
    date,
    onDateChange,
    time,
    onTimeChange,
    timeError,
}: DateTimeFieldsProps) {
    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date(Date.now() + ONE_WEEK_MS).toISOString().split('T')[0];

    return (
        <Group grow mb="md">
            <DateInput
                label="Departure Date"
                placeholder="Pick a date"
                value={date}
                onChange={onDateChange}
                required
                minDate={today}
                maxDate={maxDate}
            />
            <TimeInput
                label="Departure Time"
                value={time}
                onChange={onTimeChange}
                required
                error={timeError}
            />
        </Group>
    );
}
