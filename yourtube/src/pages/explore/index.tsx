import CategoryTabs from "@/components/category-tabs";
import Videogrid from "@/components/Videogrid";

export default function ExplorePage() {
  return (
    <main className="w-full p-3 sm:p-4 lg:p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Explore</h1>
        <p className="mt-1 text-sm text-slate-500">
          Discover videos from every category.
        </p>
      </div>
      <CategoryTabs />
      <Videogrid />
    </main>
  );
}
