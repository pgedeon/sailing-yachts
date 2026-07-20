import { requireAdmin } from '@/lib/admin-auth'
export const dynamic = 'force-dynamic';

import { db, leads } from "@/lib/db";
import { desc, sql, isNotNull } from "drizzle-orm";
import { scoreLead, explainScore } from "@/lib/lead-scoring";
import Link from "next/link";
import { ScoreAllButton } from './ScoreAllButton';

export const metadata = { title: "Lead Management — Admin" };

async function getLeads() {
  return db.query.leads.findMany({
    orderBy: (leadsTable: any, { desc: descOp }: any) => [descOp(leadsTable.createdAt)],
    limit: 100,
  });
}

async function getInsights() {
  const stats = await db.select({
    total: sql<number>`count(*)::int`,
    scored: sql<number>`count(${leads.score})::int`,
    avgScore: sql<number>`round(coalesce(avg(${leads.score}), 0)::numeric, 1)`,
    hotCount: sql<number>`count(*) filter (where ${leads.score} >= 60)`,
    warmCount: sql<number>`count(*) filter (where ${leads.score} >= 35 and ${leads.score} < 60)`,
    coldCount: sql<number>`count(*) filter (where ${leads.score} < 35 and ${leads.score} is not null)`,
    unscoredCount: sql<number>`count(*) filter (where ${leads.score} is null)`,
  }).from(leads);

  return stats[0];
}

function getTier(score: number | null): { label: string; color: string; bg: string } {
  if (score === null) return { label: "Unscored", color: "text-gray-500", bg: "bg-gray-100" };
  if (score >= 60) return { label: "🔥 Hot", color: "text-red-700", bg: "bg-red-50" };
  if (score >= 35) return { label: "Warm", color: "text-yellow-700", bg: "bg-yellow-50" };
  return { label: "Cold", color: "text-blue-700", bg: "bg-blue-50" };
}

function getScoreColor(score: number | null): string {
  if (score === null) return "text-gray-400";
  if (score >= 60) return "text-red-600 font-bold";
  if (score >= 35) return "text-yellow-600 font-semibold";
  return "text-gray-500";
}

export default async function AdminLeadsPage() {
  await requireAdmin()
  const [allLeads, insights] = await Promise.all([getLeads(), getInsights()]);

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-yellow-100 text-yellow-800",
    qualified: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
    spam: "bg-red-100 text-red-800",
    priority: "bg-purple-100 text-purple-800",
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
        <div className="flex gap-3 items-center">
          <ScoreAllButton />
          <Link href="/admin" className="text-blue-600 hover:underline text-sm">← Back to Admin</Link>
        </div>
      </div>

      {/* Score Distribution */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">{insights.hotCount}</div>
          <div className="text-xs text-gray-500">🔥 Hot (≥60)</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-yellow-600">{insights.warmCount}</div>
          <div className="text-xs text-gray-500">Warm (35-59)</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{insights.coldCount}</div>
          <div className="text-xs text-gray-500">Cold (&lt;35)</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-400">{insights.unscoredCount}</div>
          <div className="text-xs text-gray-500">Unscored</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-700">{insights.avgScore}</div>
          <div className="text-xs text-gray-500">Avg Score</div>
        </div>
      </div>

      {/* Score Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium">Score Distribution</span>
          <span className="text-xs text-gray-500">({insights.scored} / {insights.total} scored)</span>
        </div>
        <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden flex">
          {insights.total > 0 && <>
            <div className="bg-red-400 h-full" style={{ width: `${(insights.hotCount / insights.total) * 100}%` }} title={`Hot: ${insights.hotCount}`} />
            <div className="bg-yellow-400 h-full" style={{ width: `${(insights.warmCount / insights.total) * 100}%` }} title={`Warm: ${insights.warmCount}`} />
            <div className="bg-blue-300 h-full" style={{ width: `${(insights.coldCount / insights.total) * 100}%` }} title={`Cold: ${insights.coldCount}`} />
            <div className="bg-gray-300 h-full" style={{ width: `${(insights.unscoredCount / insights.total) * 100}%` }} title={`Unscored: ${insights.unscoredCount}`} />
          </>}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0</span>
          <span>35</span>
          <span>60</span>
          <span>100</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-3 text-left font-medium">Score</th>
              <th className="px-3 py-3 text-left font-medium">Tier</th>
              <th className="px-3 py-3 text-left font-medium">Date</th>
              <th className="px-3 py-3 text-left font-medium">Type</th>
              <th className="px-3 py-3 text-left font-medium">Name</th>
              <th className="px-3 py-3 text-left font-medium">Email</th>
              <th className="px-3 py-3 text-left font-medium">Yachts</th>
              <th className="px-3 py-3 text-left font-medium">Source</th>
              <th className="px-3 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {allLeads.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No leads yet</td></tr>
            )}
            {allLeads.map((lead: any) => {
              const tier = getTier(lead.score);
              return (
                <tr key={lead.id} className={`hover:bg-gray-50 ${tier.bg}`}>
                  <td className={`px-3 py-3 font-mono ${getScoreColor(lead.score)}`}>
                    {lead.score !== null ? lead.score : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs font-medium ${tier.color}`}>{tier.label}</span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs">{leadTypeLabels[lead.leadType] || lead.leadType || "—"}</span>
                  </td>
                  <td className="px-3 py-3 font-medium">{lead.name}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{lead.email}</td>
                  <td className="px-3 py-3 text-xs text-gray-500 max-w-[200px] truncate">
                    {(lead.metadata as any)?.yachtNames?.join(", ") || "—"}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500">
                    {lead.utmSource ? `${lead.utmSource}${lead.utmMedium ? ` / ${lead.utmMedium}` : ""}` : (lead.source || "—")}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColors[lead.status] || "bg-gray-100"}`}>
                      {lead.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
