import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TeeTimeUs",
  description: "Find public golf courses and tee time booking links.",
  verification: {
    google: "pM17PXV8cpHTCr3Ophkj0vVMDTrjyYWEHZlW95inn4U",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}