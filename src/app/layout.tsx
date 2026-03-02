// src/app/layout.tsx

import "./globals.css";

export const metadata = {
  title: "Florida Tee Times",
  description: "Golf is hard. Booking it shouldn’t be.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}