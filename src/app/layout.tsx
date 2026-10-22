import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:"テニス部 | コート・試合管理",description:"ダブルス練習会のコートと試合管理"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ja"><body>{children}</body></html>}
