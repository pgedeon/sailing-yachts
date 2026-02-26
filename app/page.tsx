import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Ship, Search, BarChart3, Database } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center justify-center p-2 bg-blue-100 rounded-full mb-4">
            <Ship className="h-6 w-6 text-blue-700" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight">
            Sailing Yacht <span className="text-primary">Specifications</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Explore, search, and compare detailed specifications of sailing
            yachts from top manufacturers worldwide. Perfect for sailors,
            brokers, and enthusiasts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button asChild size="lg" className="gap-2">
              <Link href="/yachts">
                <Search className="h-4 w-4" />
                Browse Yachts
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/compare">
                <BarChart3 className="h-4 w-4" />
                Compare Models
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive database designed for easy exploration and
              comparison of sailboat specs.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border border-border rounded-lg bg-card">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Rich Spec Data</h3>
              <p className="text-muted-foreground">
                Core dimensions, sail plans, accommodations, and performance
                metrics for each yacht. New spec categories can be added
                seamlessly.
              </p>
            </div>
            <div className="p-6 border border-border rounded-lg bg-card">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-green-700" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Smart Search & Filter
              </h3>
              <p className="text-muted-foreground">
                Filter by length, beam, draft, manufacturer, rig type, and any
                other spec. Filters auto-adjust as new data categories are
                added.
              </p>
            </div>
            <div className="p-6 border border-border rounded-lg bg-card">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-purple-700" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Side-by-Side Compare
              </h3>
              <p className="text-muted-foreground">
                Select up to 3 yachts and compare their specifications in a
                unified table. Differences are highlighted for quick insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Section (Admin) */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Admin Interface</h2>
          <p className="text-muted-foreground mb-6">
            An admin panel is included in MVP. Add, edit, or remove yachts and
            specs through a simple UI. Attach custom links or buttons to each
            boat for external resources.
          </p>
          <Button asChild variant="secondary">
            <Link href="/admin">Access Admin Panel</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
