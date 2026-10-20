import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import { SidebarProvider } from '@/context/SidebarContext';

export const metadata: Metadata = {
  title: 'SPK-AG — Sistem Penjadwalan Kuliah Berbasis Algoritma Genetika | UBBG',
  description: 'Aplikasi optimasi jadwal kuliah otomatis bebas bentrok berbasis Algoritma Genetika untuk Prodi Ilmu Komputer Universitas Bina Bangsa Getsempena (UBBG) Banda Aceh.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased" suppressHydrationWarning>
      <body className="h-screen w-screen overflow-hidden flex bg-[#F8FAFC] text-slate-900 font-sans" suppressHydrationWarning>
        <SidebarProvider>
          <div className="flex h-full w-full overflow-hidden relative">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
              <TopNav />
              <main className="flex-1 p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
