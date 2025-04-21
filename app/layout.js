import { Geist } from "next/font/google";
import "./globals.css";
import ReduxProvider from "./redux/provider";
import { Toaster } from "react-hot-toast";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata = {
  title: "智能答题系统",
  description: "基于深度学习的智能答题系统",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className={geist.className}>
        <ReduxProvider>
          {children}
          <Toaster position="top-center" />
        </ReduxProvider>
      </body>
    </html>
  );
}
