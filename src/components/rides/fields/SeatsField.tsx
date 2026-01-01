import { NumberInput } from "@mantine/core";

interface SeatsFieldProps {
    value: number | string;
    onChange: (value: number | string) => void;
    label?: string;
    min?: number;
    max?: number;
}

export default function SeatsField({
    value,
    onChange,
    label = "Seats",
    min = 1,
    max = 20,
}: SeatsFieldProps) {
    return (
        <NumberInput
            label={label}
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            mb="xl"
        />
    );
}
