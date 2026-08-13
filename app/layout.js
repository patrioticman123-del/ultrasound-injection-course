import "./styles.css";

export const metadata = {
  title: "超音波導引注射課程",
  description: "109 筆公開課程、兩位作者各 29 篇本人署名文獻，以及完整作者技術單元的離線臨床筆記庫。",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "超音波注射課程" },
};

export const viewport = {
  themeColor: "#103f49",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
