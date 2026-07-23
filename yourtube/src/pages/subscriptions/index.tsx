import Videogrid from "@/components/Videogrid";
import { useUser } from "@/lib/AuthContext";

export default function SubscriptionsPage() {
  const { user, handlegooglesignin } = useUser();

  return (
    <main className="w-full p-3 sm:p-4 lg:p-6">
      <div className="mb-6 rounded-2xl border bg-white p-5">
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="mt-1 text-sm text-slate-500">
          {user
            ? "Fresh videos from channels you follow and recommendations for you."
            : "Sign in to follow channels and keep your favourite creators together."}
        </p>
        {!user && (
          <button
            type="button"
            onClick={() => void handlegooglesignin()}
            className="mt-4 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Sign in
          </button>
        )}
      </div>
      {user && <Videogrid />}
    </main>
  );
}
