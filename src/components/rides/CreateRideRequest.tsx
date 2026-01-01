import RideForm from "./RideForm";

export default function CreateRideRequest() {
    return (
        <RideForm
            type="REQUEST"
            title="Request a Ride"
            submitLabel="Post Request"
            seatsLabel="Seats Needed"
        />
    );
}
