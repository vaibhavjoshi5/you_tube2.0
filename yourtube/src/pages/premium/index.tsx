import { useState } from "react";
import { Check, Crown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const plans = [
  {
    id: "free",
    name: "Free",
    amount: 0,
    watch: "5 minutes",
    features: ["One download per day", "Standard access"],
  },
  {
    id: "bronze",
    name: "Bronze",
    amount: 10,
    watch: "7 minutes",
    features: ["Unlimited downloads", "Invoice by email"],
  },
  {
    id: "silver",
    name: "Silver",
    amount: 50,
    watch: "10 minutes",
    features: ["Unlimited downloads", "Invoice by email"],
  },
  {
    id: "gold",
    name: "Gold",
    amount: 100,
    watch: "Unlimited",
    features: ["Unlimited downloads", "Unlimited viewing", "Invoice by email"],
  },
];

const loadRazorpay = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function PremiumPage() {
  const { user, updateUser, handlegooglesignin } = useUser();
  const [processing, setProcessing] = useState<string | null>(null);

  const upgrade = async (plan: string) => {
    if (!user) {
      handlegooglesignin();
      return;
    }

    setProcessing(plan);
    try {
      if (!(await loadRazorpay())) {
        throw new Error("Razorpay checkout could not be loaded");
      }

      const response = await axiosInstance.post("/payment/order", { plan });
      const order = response.data;
      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "YourTube",
        description: `${order.plan.name} plan upgrade`,
        order_id: order.orderId,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },
        theme: { color: "#dc2626" },
        handler: async (paymentResponse: any) => {
          const verification = await axiosInstance.post(
            "/payment/verify",
            paymentResponse
          );
          updateUser(verification.data.result);
          toast.success(`${order.plan.name} plan activated`);
          setProcessing(null);
        },
        modal: {
          ondismiss: () => setProcessing(null),
        },
      });
      razorpay.open();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message);
      setProcessing(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <Crown className="mx-auto mb-3 h-10 w-10 text-amber-500" />
        <h1 className="text-3xl font-bold">Choose your viewing plan</h1>
        <p className="mt-2 text-gray-600">
          Upgrade securely using Razorpay test checkout. Paid plans include
          unlimited downloads.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const current = (user?.plan || "free") === plan.id;
          return (
            <article
              key={plan.id}
              className={`rounded-2xl border p-5 ${
                current ? "border-red-500 ring-2 ring-red-100" : ""
              }`}
            >
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="my-4 text-3xl font-bold">
                ₹{plan.amount}
                <span className="text-sm font-normal text-gray-500">
                  {" "}
                  one-time
                </span>
              </p>
              <p className="mb-4 rounded-lg bg-gray-100 p-3 text-sm">
                Watch up to <strong>{plan.watch}</strong> per video
              </p>
              <ul className="mb-6 space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={current ? "secondary" : "default"}
                disabled={current || plan.id === "free" || !!processing}
                onClick={() => upgrade(plan.id)}
              >
                {current
                  ? "Current plan"
                  : processing === plan.id
                  ? "Preparing payment..."
                  : "Upgrade"}
              </Button>
            </article>
          );
        })}
      </div>
    </main>
  );
}
