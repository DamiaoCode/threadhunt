import { useState } from "react";

export default function UpdateSubscriptionModal({
  onClose,
  onOpenStripePortal,
  onOpenPlanOverlay,
  loading,
  plan,
}: {
  onClose: () => void;
  onOpenStripePortal: () => Promise<void>;
  onOpenPlanOverlay: () => void;
  loading: boolean;
  plan: string;
}) {
  const [error, setError] = useState("");

  const isPro = plan.toLowerCase() === "pro";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-xl font-semibold mb-4 text-center">
          Manage Subscription
        </h2>
        <div className="space-y-4">
          <div className="text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm mb-2">
              Current plan: <b>{plan}</b>
            </span>
          </div>
          {isPro ? (
            <button
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
              onClick={onOpenStripePortal}
              disabled={loading}
            >
              Manage Subscription
            </button>
          ) : (
            <button
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-60"
              onClick={onOpenPlanOverlay}
              disabled={loading}
            >
              Subscribe
            </button>
          )}
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}
