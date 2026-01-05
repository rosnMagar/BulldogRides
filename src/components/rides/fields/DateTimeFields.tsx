import { Group } from "@mantine/core";
import { DateInput, TimeInput } from "@mantine/dates";

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
    // Correctly handle date conversion without timezone shifts
    const parseDate = (dateStr: string | null) => {
        if (!dateStr) return null;
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const formatDate = (date: Date | null) => {
        if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);

    return (
        <Group grow mb="md" align="flex-start">
            <DateInput
                label="Departure Date"
                placeholder="Pick a date"
                value={parseDate(date)}
                onChange={(val: any) => {
                    if (val instanceof Date) {
                        onDateChange(formatDate(val));
                    } else {
                        onDateChange(val);
                    }
                }}
                required
                minDate={today}
                maxDate={maxDate}
                inputMode="none"
                styles={{
                    input: { cursor: 'pointer' }
                }}
            />
            <TimeInput
                label="Departure Time"
                value={time}
                onChange={onTimeChange}
                required
                error={timeError}
                inputMode="none"
                styles={{
                    input: { cursor: 'pointer' }
                }}
            />
        </Group>
    );
}
