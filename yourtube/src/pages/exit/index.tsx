import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ExitPage() {
  return (
    <main className="flex min-h-[70vh] w-full items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-3xl font-bold">YourTube closed</h1>
        <p className="mt-2 text-gray-500">
          Your browser protected this tab from being closed automatically.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Open YourTube again</Link>
        </Button>
      </div>
    </main>
  );
}
