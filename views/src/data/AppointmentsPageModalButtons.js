export const ConfirmButton = [
    {
        text: "Confirm",
        variant: "primary",
        onClick: (closeModal) => {
            closeModal(); // optionally close the modal
        },
    },
];

export const CloseButton = [
    {
        text: "Close",
        variant: "secondary",
        // the onClick receives the close function automatically from the component
        onClick: (closeModal) => {
            closeModal();
        },
    },
]

export const CancelAppointmentButton = [
    {
        text: "Cancel Appointment",
        variant: "danger",
        onClick: (closeModal) => {
            closeModal();
        }
    }
]