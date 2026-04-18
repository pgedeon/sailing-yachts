import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Newsletter — Sailing Yacht Info",
  description: "Subscribe to get updates on new yacht models, guides, and comparison tools.",
  robots: { index: true, follow: true },
};

export default function NewsletterPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Stay Updated</h1>
        <p className="mt-3 text-lg text-gray-600">
          Get notified when we add new yacht models, publish guides, or launch comparison tools.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <form id="newsletter-form" className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 transition"
          >
            Subscribe
          </button>
          <p className="text-xs text-gray-500 text-center">
            No spam. Unsubscribe anytime. We send at most a few emails per month.
          </p>
        </form>
        <div id="newsletter-success" className="hidden text-center py-4">
          <div className="text-4xl mb-2">⛵</div>
          <h2 className="text-xl font-semibold text-gray-900">You&apos;re subscribed!</h2>
          <p className="text-gray-600 mt-1">We&apos;ll send updates to your inbox.</p>
        </div>
        <div id="newsletter-error" className="hidden text-center py-4">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-red-600 text-sm">Something went wrong. Please try again.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="text-center p-4">
          <div className="text-2xl mb-1">📊</div>
          <div className="text-sm font-medium text-gray-900">New Yacht Specs</div>
          <p className="text-xs text-gray-500 mt-1">When we add models to the database</p>
        </div>
        <div className="text-center p-4">
          <div className="text-2xl mb-1">📖</div>
          <div className="text-sm font-medium text-gray-900">Guides &amp; How-tos</div>
          <p className="text-xs text-gray-500 mt-1">Sailing guides and buying advice</p>
        </div>
        <div className="text-center p-4">
          <div className="text-2xl mb-1">⚖️</div>
          <div className="text-sm font-medium text-gray-900">Comparison Updates</div>
          <p className="text-xs text-gray-500 mt-1">New comparison tools and features</p>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('newsletter-form').addEventListener('submit', async function(e) {
          e.preventDefault();
          var email = document.getElementById('email').value;
          var form = this;
          var success = document.getElementById('newsletter-success');
          var error = document.getElementById('newsletter-error');
          try {
            var res = await fetch('/api/newsletter', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email, source: 'newsletter-page' })
            });
            if (res.ok) {
              form.classList.add('hidden');
              success.classList.remove('hidden');
            } else {
              error.classList.remove('hidden');
            }
          } catch(err) {
            error.classList.remove('hidden');
          }
        });
      `}} />
    </div>
  );
}
