import Link from "next/link";
import HeaderAuthControls from "@/components/HeaderAuthControls";
import { generateSiteNavigationJsonLd } from "@/lib/seo";
import { MobileMenuKeyboard } from "./MobileMenuKeyboard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateSiteNavigationJsonLd([
              { name: "Browse", path: "/yachts" },
              { name: "Manufacturers", path: "/manufacturers" },
              { name: "Guides", path: "/guides" },
              { name: "Glossary", path: "/glossary" },
              { name: "Search", path: "/search" },
              { name: "Compare", path: "/compare" },
            ])
          ),
        }}
      />
      {/* Skip to content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:text-gray-900 focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg focus:border focus:border-blue-500 focus:outline-none"
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content" role="main" className="min-h-screen">{children}</main>
      <footer role="contentinfo" className="border-t border-border py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Sailing Yacht Info. All rights
            reserved.
          </p>
          <p className="mt-1">
            Data sourced from manufacturer specifications.
          </p>
          <p className="mt-2 text-xs">
            Built with ❤️ by <a href="https://3dput.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">3DPUT</a> ·{" "}
            <a href="https://sailboats.fr" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Sailboats.fr</a>
          </p>
        </div>
      </footer>
    </>
  );
}

function Header() {
  return (
    <header role="banner" className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-xl font-bold text-primary tracking-tight flex-shrink-0"
          >
            Sailing Yacht Info
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <nav aria-label="Main navigation" className="flex items-center gap-6">
            <NavLink href="/yachts">Browse</NavLink>
            <NavLink href="/manufacturers">Manufacturers</NavLink>
            <NavLink href="/guides">Guides</NavLink>
            <NavLink href="/glossary">Glossary</NavLink>
            <NavLink href="/search">Search</NavLink>
            <NavLink href="/compare">Compare</NavLink>
            <NavLink href="/favorites">Favorites</NavLink>
            </nav>
            <HeaderAuthControls />
          </div>

          {/* Mobile hamburger */}
          <MobileMenuKeyboard />
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </Link>
  );
}
