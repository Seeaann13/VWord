import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import AdBanner from '@/components/AdBanner';
import BottomNav from '@/components/BottomNav';
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import ThemeLanguageToggles from '@/components/providers/ThemeLanguageToggles';
import ClientInitializer from '@/components/providers/ClientInitializer';
import { SyncProvider } from '@/components/providers/SyncProvider';

const inter = Inter({ subsets: ['latin'] });
const playfair = Playfair_Display({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'vlens',
  description: 'Visual Memory & Scene Restoration Vocabulary Tool',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${inter.className} bg-[var(--bg)] text-[var(--text)] antialiased flex flex-col min-h-[100dvh] overflow-x-hidden`}
        suppressHydrationWarning
      >
        <ClerkProvider>
          <ThemeProvider>
            <LanguageProvider>
              <ClientInitializer />
              <SyncProvider>
                {/* Immersive Background Elements */}
              <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-emerald-500/5 blur-[120px] rounded-full" />
              </div>

              {/* HUD-style Header */}
              <header className="flex-none h-20 flex items-center justify-between px-8 bg-transparent relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center v-glow">
                    <span className="font-black text-black text-xl">V</span>
                  </div>
                  <h1 className={`${playfair.className} text-2xl font-bold tracking-tight text-[var(--text)]/90`}>vlens</h1>
                </div>
                
                <div className="flex items-center gap-4">
                  <ThemeLanguageToggles />
                  
                  <div className="h-6 w-[1px] bg-white/10 mx-1" />
                  
                  <Show when="signed-out">
                    <div className="flex items-center gap-2">
                      <SignInButton mode="modal">
                        <button className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                          Login
                        </button>
                      </SignInButton>
                    </div>
                  </Show>
                  <Show when="signed-in">
                    <UserButton afterSignOutUrl="/" />
                  </Show>
                </div>
              </header>

              {/* Main Content Area */}
              <main className="flex-1 relative w-full max-w-2xl mx-auto px-6 pb-40 z-10">
                {children}
              </main>

              {/* Floating Bottom Nav Container */}
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-md z-50">
                <BottomNav />
              </div>
            </SyncProvider>
          </LanguageProvider>
        </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
