import RideForm from "./RideForm";

export default function CreateRideOffer() {
    return (
        <RideForm
            type="OFFER"
            title="Offer a Ride"
            submitLabel="Post Offer"
            seatsLabel="Seats Available"
        />
    );
}
