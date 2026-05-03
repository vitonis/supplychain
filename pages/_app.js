import "../styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiConfig } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { config } from "../config/wagmi";
import { useEffect, useState } from "react";
import GlobalErrorBoundary from "../components/Layout/GlobalErrorBoundary";

if (typeof window !== "undefined") {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = function (...args) {
    const message = args[0];
    if (
      typeof message === "string" &&
      (message.includes("Hydration failed") ||
        message.includes("Text content did not match") ||
        message.includes("Server HTML") ||
        message.includes("client-side rendered") ||
        message.includes("Expected server HTML to contain") ||
        message.includes("react-hydration-error") ||
        message.includes("Minified React error #418") ||
        message.includes("Minified React error #425"))
    ) {
      return; // Suppress hydration errors globally
    }
    return originalError.apply(console, args);
  };

  console.warn = function (...args) {
    const message = args[0];
    if (
      typeof message === "string" &&
      (message.includes("Expected server HTML") ||
        message.includes("hydration") ||
        message.includes("useLayoutEffect does nothing on the server"))
    ) {
      return; // Suppress hydration warnings globally
    }
    return originalWarn.apply(console, args);
  };
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent hydration mismatches from query data
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function App({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);

    // Additional delay to ensure complete hydration
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Show loading state until hydration is complete
  if (!mounted || !isHydrated) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f0f0f",
          color: "#ffffff",
          fontSize: "16px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              border: "4px solid #333",
              borderTop: "4px solid #007bff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          ></div>
          <div style={{ fontSize: "18px", fontWeight: "500" }}>
            Initializing Supply Chain DApp...
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="hydration-safe hydrated">
      <GlobalErrorBoundary>
        <WagmiConfig config={config}>
          <QueryClientProvider client={queryClient}>
              <>
                <Component {...pageProps} />

              {/* Only render Toaster after hydration to prevent SSR issues */}
              {mounted && (
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: "#363636",
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: "500",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: "#10B981",
                        secondary: "#ffffff",
                      },
                      style: {
                        background: "#10B981",
                        color: "#ffffff",
                      },
                    },
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: "#EF4444",
                        secondary: "#ffffff",
                      },
                      style: {
                        background: "#EF4444",
                        color: "#ffffff",
                      },
                    },
                    loading: {
                      duration: Infinity,
                      style: {
                        background: "#3B82F6",
                        color: "#ffffff",
                      },
                    },
                  }}
                  // Prevent hydration mismatches
                  gutter={8}
                  containerStyle={{
                    top: 20,
                    right: 20,
                  }}
                />
              )}
              </>
          </QueryClientProvider>
        </WagmiConfig>
      </GlobalErrorBoundary>
    </div>
  );
}
