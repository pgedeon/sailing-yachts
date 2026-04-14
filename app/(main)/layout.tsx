import { generateSiteNavigationJsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";

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
      <Header />
      <main className="min-h-screen">{children}</main>
      <footer className="border-t border-border py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Sailing Yachts Database. All rights
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
    <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a
            href="/"
            className="text-xl font-bold text-primary tracking-tight flex-shrink-0"
          >
            Sailing Yachts
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink href="/yachts">Browse</NavLink>
            <NavLink href="/manufacturers">Manufacturers</NavLink>
            <NavLink href="/guides">Guides</NavLink>
            <NavLink href="/glossary">Glossary</NavLink>
            <NavLink href="/search">Search</NavLink>
            <NavLink href="/compare">Compare</NavLink>
            <NavLink href="/favorites">Favorites</NavLink>
          </nav>

          {/* Mobile hamburger */}
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </a>
  );
}

function MobileMenu() {
  return (
    <div className="md:hidden">
      <button
        id="mobile-menu-btn"
        type="button"
        className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
        aria-label="Open menu"
        aria-expanded="false"
      >
        <svg id="menu-icon-open" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg id="menu-icon-close" className="h-6 w-6 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div
        id="mobile-menu-panel"
        className="hidden absolute left-0 right-0 top-16 bg-white border-b border-border shadow-lg z-50"
      >
        <nav className="flex flex-col py-2">
          <a href="/yachts" className="px-6 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
            Browse Yachts
          </a>
          <a href="/manufacturers" className="px-6 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
            Manufacturers
          </a>
          <a href="/guides" className="px-6 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
            Guides
          </a>
          <a href="/glossary" className="px-6 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
            Glossary
          </a>
          <a href="/search" className="px-6 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
            Search
          </a>
          <a href="/compare" className="px-6 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
            Compare
          </a>
          <a href="/favorites" className="px-6 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
            Favorites
          </a>
        </nav>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var btn = document.getElementById('mobile-menu-btn');
              var panel = document.getElementById('mobile-menu-panel');
              var iconOpen = document.getElementById('menu-icon-open');
              var iconClose = document.getElementById('menu-icon-close');
              if (!btn || !panel) return;
              btn.addEventListener('click', function() {
                var isOpen = !panel.classList.contains('hidden');
                if (isOpen) {
                  panel.classList.add('hidden');
                  iconOpen.classList.remove('hidden');
                  iconClose.classList.add('hidden');
                  btn.setAttribute('aria-expanded', 'false');
                } else {
                  panel.classList.remove('hidden');
                  iconOpen.classList.add('hidden');
                  iconClose.classList.remove('hidden');
                  btn.setAttribute('aria-expanded', 'true');
                }
              });
              document.addEventListener('click', function(e) {
                if (!panel.contains(e.target) && !btn.contains(e.target)) {
                  panel.classList.add('hidden');
                  iconOpen.classList.remove('hidden');
                  iconClose.classList.add('hidden');
                  btn.setAttribute('aria-expanded', 'false');
                }
              });
            })();
          `,
        }}
      />
    </div>
  );
}
