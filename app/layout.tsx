import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Pacifico } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Chrome } from "@/components/Chrome";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pacifico",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Temenin · find a buddy for the plan you already have",
  description:
    "Temenin matches you with a verified activity buddy and keeps names, places and times locked until you are verified too.",
  applicationName: "Temenin",
  icons: { icon: "/brand/icon-256.png", apple: "/brand/icon-256.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff6dc" },
    { media: "(prefers-color-scheme: dark)", color: "#425b9a" },
  ],
};

const modeScript = `try{var m=JSON.parse((localStorage.getItem("temenin.state.v6")||localStorage.getItem("temenin.state.v5")||localStorage.getItem("temenin.state.v2")||"{}")||"{}");if(m.mode&&m.mode!=="system")document.documentElement.dataset.mode=m.mode;if(m.locale)document.documentElement.lang=m.locale;}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${pacifico.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: modeScript }} />
      </head>
      <body>
        <StoreProvider>
          <Chrome>{children}</Chrome>
        </StoreProvider>
      </body>
    </html>
  );
}
