import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "./redux/provider";
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "智能答题系统",
  description: "基于大语言模型的智能答题系统",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ReduxProvider>
          {children}
          <Toaster position="top-center" />
        </ReduxProvider>
      </body>
    </html>
  );
}
