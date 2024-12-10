import type { Metadata } from "next";
import { Roboto_Serif } from "next/font/google";
import "./globals.css";

const roboto_serif = Roboto_Serif({
  subsets: ['latin'],
  variable: "--font-roboto-serif",
  display: "swap"
});

export const metadata: Metadata = {
  title: "XRP Web App",
  description: "XRP Robot Software Development Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${roboto_serif.variable} ${roboto_serif.variable} antialiased overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
