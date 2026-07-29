import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { LenisProvider } from "@/providers/LenisProvider";
import { CartDrawer } from "@/components/layout/CartDrawer";
import BrandReveal from "@/components/ui/BrandReveal";
import { StoreBackButton } from "@/components/ui/StoreBackButton";
import { PageTransition } from "@/components/ui/PageTransition";
import { CommandMenu } from "@/components/ui/CommandMenu";
import { RecentlyViewedProvider } from "@/contexts/RecentlyViewedContext";
import { CompareProvider } from "@/contexts/CompareContext";
import { QuickViewProvider } from "@/contexts/QuickViewContext";
import { CompareDrawer } from "@/components/ui/CompareDrawer";
import { QuickViewModal } from "@/components/ui/QuickViewModal";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { AlertsProvider } from "@/contexts/AlertsContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MATTE. | Premium Engineered Products",
  description: "A premium e-commerce experience designed with restraint, precision, and an obsession for detail.",
};

const themeScript = `
  (function() {
    try {
      var storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'light' || storedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', storedTheme);
      } else {
        var isLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        var defaultTheme = isLight ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', defaultTheme);
        // Do not auto-set localStorage here, keep it as system preference unless explicitly toggled
      }
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    // Intro animation check to prevent SSR flash
    try {
      var hasPlayed = sessionStorage.getItem('brand_reveal_played');
      var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (hasPlayed || prefersReducedMotion) {
        document.documentElement.setAttribute('data-intro', 'played');
      } else {
        document.documentElement.setAttribute('data-intro', 'pending');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.className} min-h-full flex flex-col bg-background text-foreground`}>
        <BrandReveal />
        <LenisProvider>
          <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <RecentlyViewedProvider>
                <CompareProvider>
                    <QuickViewProvider>
                      <PreferencesProvider>
                        <AlertsProvider>
                          <CartProvider>
                            <StoreBackButton />
                            <Navbar />
                            <CartDrawer />
                            <CompareDrawer />
                            <QuickViewModal />
                            <CommandMenu />
                            <main className="flex-grow flex flex-col pt-24 md:pt-28">
                              <PageTransition>
                                {children}
                              </PageTransition>
                            </main>
                            <Footer />
                          </CartProvider>
                        </AlertsProvider>
                      </PreferencesProvider>
                    </QuickViewProvider>
                  </CompareProvider>
                </RecentlyViewedProvider>
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
