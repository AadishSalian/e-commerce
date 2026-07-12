import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/contexts/AuthContext";

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
        <AuthProvider>
          <Navbar />
          <main className="flex-grow pt-24 md:pt-28">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
