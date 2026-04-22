export const dynamic = 'force-dynamic';

import { db, leads } from "@/lib/db";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";

export const metadata = { title: "Lead Management — Admin" };

async function getLeads() {
  return db.query.leads.findMany({
    orderBy: (leadsTable: any, { desc: descOp }: any) => [descOp(leadsTable.createdAt)],
    limit: 100,
  });
}

export default async function AdminLeadsPage() {
  const allLeads = await getLeads();

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-yellow-100 text-yellow-800",
    qualified: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
    spam: "bg-red-100 text-red-800",
  };

  const leadTypeLabels: Record<string, string> = {
    dealer_inquiry: "📞 Dealer Inquiry",
    price_request: "💰 Price Request",
    find_similar: "🔍 Find Similar",
    general: "✉️ General",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Lead Management</h1>
          <p className="text-gray-500 text-sm mt-1">{allLeads.length} leads total</p>
        </div>
        <Link href="/admin" className="text-blue-600 hover:underline text-sm">← Back to Admin</Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Yachts</th>
              <th className="px-4 py-3 text-left font-medium">Source</th>
              <th className="px-4 py-3 text-left font-medium">UTM</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {allLeads.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No leads yet</td></tr>
            )}
            {allLeads.map((lead: any) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                  {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs">{leadTypeLabels[lead.leadType] || lead.leadType || "—"}</span>
                </td>
                <td className="px-4 py-3 font-medium">{lead.name}</td>
                <td className="px-4 py-3 text-gray-600">{lead.email}</td>
                <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">
                  {(lead.metadata as any)?.yachtNames?.join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{lead.source || "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {lead.utmSource ? `${lead.utmSource}${lead.utmMedium ? ` / ${lead.utmMedium}` : ""}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColors[lead.status] || "bg-gray-100"}`}>
                    {lead.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
