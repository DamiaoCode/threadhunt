import { useState } from "react";

export default function PlanOverlay({
  onStarter,
  onPro,
}: {
  onStarter: () => void;
  onPro: (priceId: string) => void;
}) {
  const [showProOptions, setShowProOptions] = useState(false);

  // Os teus price IDs reais aqui
  const monthlyPriceId = "price_1RRGEaB0U9ZOpxhjme50ThWb"; // substitui pelo real
  const yearlyPriceId = "price_1RRGEaB0U9ZOpxhj3yMIvwLD"; // substitui pelo real

  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-lg z-50 flex items-center justify-center">
      <div className="max-w-4xl w-full p-6">
        <h2 className="text-3xl font-semibold mb-12 text-center">
          Choose a Plan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* Starter Plan */}
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
            <h3 className="text-xl font-semibold mb-2">Starter</h3>
            <p className="text-2xl font-bold mb-4">
              €0<span className="text-sm font-normal"> /mo</span>
            </p>
            <ul className="text-gray-600 space-y-2 mb-6">
              <li>✅ Up to 5 hunts per month</li>
              <li>❌ No CSV export</li>
              <li>❌ Limited to 50 opportunities</li>
              <li>✅ Access to core discovery tools</li>
              <li>❌ Competitor insights</li>
            </ul>
            <button
              className="mt-auto bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
              onClick={onStarter}
            >
              Get Started
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-zinc-100 border-2 border-black rounded-xl shadow-lg p-6 flex flex-col transform md:scale-105 relative">
            <h3 className="text-xl font-semibold mb-2">Pro</h3>
            <p className="text-2xl font-bold mb-1">
              €19<span className="text-sm font-normal"> /mo</span>
            </p>
            <p className="text-sm text-gray-500 mb-4">or €99/year</p>
            <ul className="text-gray-700 space-y-2 mb-6">
              <li>✅ Unlimited hunts (fair use)</li>
              <li>✅ Competitor detection</li>
              <li>✅ CSV export</li>
              <li>✅ Email support</li>
            </ul>

            {!showProOptions ? (
              <button
                className="mt-auto bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
                onClick={() => setShowProOptions(true)}
              >
                Upgrade Now
              </button>
            ) : (
              <div className="mt-auto space-y-2">
                <button
                  className="w-full bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
                  onClick={() => onPro(monthlyPriceId)}
                >
                  €19 / month
                </button>
                <button
                  className="w-full bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
                  onClick={() => onPro(yearlyPriceId)}
                >
                  €199 / year
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
