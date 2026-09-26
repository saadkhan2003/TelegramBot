import './globals.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export const metadata = {
  title: 'Apex Store — Admin Control Panel',
  description: 'Telegram Digital Store + Admin Web Management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 flex min-h-screen">
        <Sidebar />
        <div className="flex-1 pl-64 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-8 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
