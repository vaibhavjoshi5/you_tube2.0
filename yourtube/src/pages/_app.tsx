import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";
import Head from "next/head";
import { useEffect, useState } from "react";
import AuthVerificationDialog from "@/components/AuthVerificationDialog";

export default function App({ Component, pageProps }: AppProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [Component]);

  return (
    <UserProvider>
      <Head>
        <title>YourTube</title>
        <meta
          name="description"
          content="Discover, watch, upload and share videos on YourTube."
        />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <Header onMenuClick={() => setIsSidebarOpen((value) => !value)} />
        <AuthVerificationDialog />
        <Toaster />
        <div className="flex min-w-0">
          <Sidebar className="hidden md:block" />
          {isSidebarOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <button
                type="button"
                aria-label="Close navigation menu"
                className="absolute inset-0 bg-black/45"
                onClick={() => setIsSidebarOpen(false)}
              />
              <Sidebar
                className="relative h-full shadow-2xl"
                onNavigate={() => setIsSidebarOpen(false)}
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <Component {...pageProps} />
          </div>
        </div>
      </div>
    </UserProvider>
  );
}
