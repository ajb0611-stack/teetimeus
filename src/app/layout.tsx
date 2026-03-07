import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="google-site-verification"
          content="pM17PXV8cpHTCr3Ophkj0vVMDTrjyYWEHZlW95inn4U"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}