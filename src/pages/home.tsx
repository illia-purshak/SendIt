import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { APP_ROUTES } from "@/constants/app-routes";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <main className="py-12">
      <h1 className="mb-1 text-2xl font-semibold text-neutral-900">
        Welcome back
      </h1>
      <p className="mb-10 text-sm text-neutral-500">
        What would you like to do today?
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ActionCard
          title="Send a parcel"
          description="Create a new shipment and get a delivery quote."
          icon="📦"
        />
        <ActionCard
          title="Track shipment"
          description="Check the real-time status of your packages."
          icon="📍"
        />
        <ActionCard
          title="My orders"
          description="View your full shipment history and invoices."
          icon="🗂️"
        />
        <ActionCard
          title="Parcel Templates"
          description="Manage reusable sender, recipient, and item templates."
          icon="📋"
          onClick={() => navigate(APP_ROUTES.parcelTemplates)}
        />
      </div>
    </main>
  );
}

function ActionCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: string;
  onClick?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-semibold text-neutral-900">{title}</p>
        <p className="mt-0.5 text-sm text-neutral-500">{description}</p>
      </div>
      <Button
        color="green"
        className="mt-auto w-full text-sm"
        disabled={!onClick}
        onClick={onClick}
      >
        {onClick ? "Open" : "Coming soon"}
      </Button>
    </div>
  );
}
