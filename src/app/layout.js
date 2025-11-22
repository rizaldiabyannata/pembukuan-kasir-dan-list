import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AlertDialogProvider } from "@/components/ui/alert-dialog-provider";
import { AccessibilityAnnouncer } from "@/components/ui/accessibility-announcer";
import { initStorage } from "@/lib/file-storage";

// Initialize storage on app startup
if (typeof window === "undefined") {
  // This runs only on server
  initStorage().catch((err) => {
    console.error("Failed to initialize storage:", err);
  });
}

export const metadata = {
  title: {
    default: "Pembukuan Kasir & Rental Mobil",
    template: "%s | Pembukuan Kasir",
  },
  description:
    "Sistem manajemen pembukuan kasir dan rental mobil untuk mencatat transaksi, pengeluaran, armada, dan laporan keuangan",
  keywords: [
    "pembukuan",
    "kasir",
    "rental mobil",
    "manajemen armada",
    "laporan keuangan",
    "transaksi",
  ],
  authors: [{ name: "Pembukuan Kasir Team" }],
  creator: "Pembukuan Kasir",
  publisher: "Pembukuan Kasir",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "Pembukuan Kasir & Rental Mobil",
    description: "Sistem manajemen pembukuan kasir dan rental mobil",
    type: "website",
    locale: "id_ID",
    siteName: "Pembukuan Kasir",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body suppressHydrationWarning className="antialiased min-h-screen">
        <AlertDialogProvider>
          {children}
          <Toaster />
          <AccessibilityAnnouncer />
        </AlertDialogProvider>
      </body>
    </html>
  );
}
