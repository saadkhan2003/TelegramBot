import './globals.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export const metadata = {
  title: 'Delux Store — Admin Control Panel',
  description: 'Telegram Digital Store + Admin Web Management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f3f2f1] text-[#201f1e] flex min-h-screen font-sans antialiased">
        <Sidebar />
        <div className="flex-1 pl-64 flex flex-col min-h-screen bg-[#f3f2f1]">
          <Header />
          <main className="flex-1 p-8 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
