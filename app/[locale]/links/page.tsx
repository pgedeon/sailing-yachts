import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Links & Resources",
  description: "Related projects and resources from the Sailing Yacht Info team.",
};

const PROJECTS = [
  {
    name: "3DPUT — 3D Printing Tools & Comparisons",
    url: "https://3dput.com",
    description: "The most comprehensive 3D printing filament settings database. Find optimal print settings for any printer and filament combination.",
  },
  {
    name: "Sailboats.fr — Guides Voile",
    url: "https://sailboats.fr",
    description: "French sailing guides, equipment reviews, and destination itineraries for sailors.",
  },
  {
    name: "Null Pictures — Art & Prints",
    url: "https://null.pictures",
    description: "Handmade linocut prints and wall art.",
  },
  {
    name: "Sailing Yacht Info on GitHub",
    url: "https://github.com/pgedeon/sailing-yachts",
    description: "Open source sailing yacht database. Contribute specs and improvements.",
  },
];

export default function LinksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Links & Resources</h1>
      <p className="text-gray-500 mb-8">Related projects from the Sailing Yacht Info team</p>
      <div className="grid gap-6">
        {PROJECTS.map((p) => (
          <a
            key={p.url}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border rounded-xl p-6 hover:shadow-md transition-shadow hover:border-blue-300"
          >
            <h2 className="text-xl font-semibold text-blue-600 hover:underline">{p.name}</h2>
            <p className="text-gray-600 mt-2">{p.description}</p>
            <span className="text-sm text-gray-500 mt-2 block">{p.url}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
