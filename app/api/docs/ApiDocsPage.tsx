'use client';

import { useState, useEffect, useCallback } from 'react';
import { openApiSpec } from '@/lib/openapi-schema';

const BASE_URL = 'https://info.sailboats.fr/api/v1';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type EndpointId = string;

interface TryResult {
  status: number;
  body: string;
  duration: number;
}

interface EndpointEntry {
  path: string;
  method: string;
  spec: Record<string, any>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function methodBadge(method: string) {
  const colors: Record<string, string> = {
    GET: 'bg-emerald-100 text-emerald-800',
    POST: 'bg-blue-100 text-blue-800',
    PUT: 'bg-amber-100 text-amber-800',
    DELETE: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold tracking-wide ${colors[method] || 'bg-gray-200 text-gray-800'}`}>
      {method}
    </span>
  );
}

function SchemaTable({ schema, depth = 0 }: { schema: any; depth?: number }) {
  if (!schema || depth > 3) return null;
  const props = schema.properties || {};
  const entries = Object.entries(props);
  if (entries.length === 0) return <span className="text-gray-500 text-sm">No properties</span>;

  return (
    <div className={`overflow-x-auto ${depth > 0 ? 'ml-4 border-l-2 border-gray-200 pl-3' : ''}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-1 pr-4 font-medium text-gray-600">Field</th>
            <th className="text-left py-1 pr-4 font-medium text-gray-600">Type</th>
            <th className="text-left py-1 pr-4 font-medium text-gray-600">Required</th>
            <th className="text-left py-1 font-medium text-gray-600">Description</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([name, prop]: [string, any]) => {
            const required = (schema.required || []).includes(name);
            const hasRef = prop.$ref || (prop.items && prop.items.$ref);
            const refName = hasRef
              ? (prop.$ref || prop.items.$ref).split('/').pop()
              : null;
            const typeLabel = prop.type
              ? prop.items
                ? `${prop.type}&lt;${refName || 'object'}&gt;`
                : prop.enum
                  ? `enum (${prop.enum.join(' | ')})`
                  : prop.type
              : refName || 'object';

            return (
              <tr key={name} className="border-b border-gray-100">
                <td className="py-1 pr-4 font-mono text-xs text-blue-700">
                  {name}
                  {hasRef && refName && (
                    <a
                      href={`#schema-${refName.toLowerCase()}`}
                      className="ml-1 text-blue-400 hover:text-blue-600"
                      title={`Go to ${refName}`}
                    >
                      ↗
                    </a>
                  )}
                </td>
                <td className="py-1 pr-4 text-gray-600 text-xs">
                  <span dangerouslySetInnerHTML={{ __html: typeLabel }} />
                </td>
                <td className="py-1 pr-4">
                  {required ? <span className="text-red-500 text-xs font-bold">✓</span> : <span className="text-gray-500 text-xs">—</span>}
                </td>
                <td className="py-1 text-gray-500 text-xs">
                  {prop.description || ''}
                  {prop.example && <span className="ml-1 text-gray-500">(e.g. {JSON.stringify(prop.example)})</span>}
                  {prop.default !== undefined && <span className="ml-1 text-gray-500">(default: {JSON.stringify(prop.default)})</span>}
                  {prop.minimum !== undefined && <span className="ml-1 text-gray-500">(min: {prop.minimum})</span>}
                  {prop.maximum !== undefined && <span className="ml-1 text-gray-500">(max: {prop.maximum})</span>}
                  {prop.minLength !== undefined && <span className="ml-1 text-gray-500">(min length: {prop.minLength})</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Try-It Widget                                                      */
/* ------------------------------------------------------------------ */
function TryIt({ path, method }: { path: string; method: string }) {
  const [params, setParams] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TryResult | null>(null);

  const endpoint = openApiSpec.paths[path]?.[method.toLowerCase()] as Record<string, any> | undefined;
  const parameters: Record<string, any>[] = endpoint?.parameters || [];

  useEffect(() => {
    setParams({});
    setResult(null);
  }, [path, method]);

  const buildUrl = useCallback(() => {
    let url = `${BASE_URL}${path}`;
    const queryParams: string[] = [];
    for (const p of parameters) {
      const val = params[p.name];
      if (!val) continue;
      if (p.in === 'path') {
        url = url.replace(`{${p.name}}`, encodeURIComponent(val));
      } else if (p.in === 'query') {
        queryParams.push(`${p.name}=${encodeURIComponent(val)}`);
      }
    }
    if (queryParams.length) url += '?' + queryParams.join('&');
    return url;
  }, [path, params, parameters]);

  const handleTry = async () => {
    setLoading(true);
    const url = buildUrl();
    const t0 = performance.now();
    try {
      const res = await fetch(url);
      const duration = Math.round(performance.now() - t0);
      const json = await res.json();
      setResult({ status: res.status, body: JSON.stringify(json, null, 2), duration });
    } catch (err: any) {
      setResult({ status: 0, body: `Network error: ${err.message}`, duration: Math.round(performance.now() - t0) });
    } finally {
      setLoading(false);
    }
  };

  const pathParams = parameters.filter((p) => p.in === 'path');
  const queryParams = parameters.filter((p) => p.in === 'query');

  return (
    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Try it</span>
        <button
          onClick={handleTry}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Sending…' : 'Send'}
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* URL preview */}
        <div className="bg-gray-900 text-green-300 font-mono text-xs p-2 rounded break-all">
          {methodBadge(method)}{' '}
          <span className="text-white">{buildUrl()}</span>
        </div>

        {/* Path params */}
        {pathParams.length > 0 && (
          <div className="space-y-2">
            {pathParams.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <label className="text-xs font-mono text-gray-600 w-28 flex-shrink-0">
                  {p.name}
                  {p.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  type="text"
                  placeholder={p.example || p.description}
                  value={params[p.name] || ''}
                  onChange={(e) => setParams({ ...params, [p.name]: e.target.value })}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            ))}
          </div>
        )}

        {/* Query params */}
        {queryParams.length > 0 && (
          <details className="group">
            <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
              Query Parameters ({queryParams.length})
            </summary>
            <div className="mt-2 space-y-2">
              {queryParams.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <label className="text-xs font-mono text-gray-600 w-28 flex-shrink-0">
                    {p.name}
                    {p.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <input
                    type="text"
                    placeholder={p.example ? String(p.example) : p.description || ''}
                    value={params[p.name] || ''}
                    onChange={(e) => setParams({ ...params, [p.name]: e.target.value })}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  {p.schema?.default !== undefined && (
                    <span className="text-xs text-gray-500">default: {JSON.stringify(p.schema.default)}</span>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded font-bold ${result.status < 300 ? 'bg-green-100 text-green-800' : result.status < 500 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                {result.status}
              </span>
              <span className="text-gray-500">{result.duration}ms</span>
            </div>
            <pre className="bg-gray-900 text-green-300 text-xs font-mono p-3 rounded max-h-80 overflow-auto">
              {result.body}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Endpoint Card                                                      */
/* ------------------------------------------------------------------ */
function EndpointCard({
  path,
  method,
  spec,
  expanded,
  onToggle,
}: {
  path: string;
  method: string;
  spec: Record<string, any>;
  expanded: boolean;
  onToggle: () => void;
}) {
  const responses = spec.responses || {};
  const statusCodes = Object.keys(responses);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden" id={`endpoint-${path.replace(/[{}\/]/g, '-')}-${method.toLowerCase()}`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 bg-white hover:bg-gray-50 transition-colors flex items-center gap-3"
      >
        {methodBadge(method)}
        <code className="text-sm font-mono text-gray-800 flex-1">{path}</code>
        <span className="text-sm text-gray-500">{spec.summary}</span>
        <span className="text-gray-500">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-gray-200 px-4 py-4 space-y-4">
          {spec.description && <p className="text-sm text-gray-600">{spec.description}</p>}

          {spec.tags?.length > 0 && (
            <div className="flex gap-2">
              {spec.tags.map((tag: string) => (
                <span key={tag} className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">{tag}</span>
              ))}
            </div>
          )}

          {spec.parameters?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Parameters</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-1 pr-3 font-medium text-gray-600">Name</th>
                      <th className="text-left py-1 pr-3 font-medium text-gray-600">In</th>
                      <th className="text-left py-1 pr-3 font-medium text-gray-600">Required</th>
                      <th className="text-left py-1 pr-3 font-medium text-gray-600">Type</th>
                      <th className="text-left py-1 font-medium text-gray-600">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spec.parameters.map((p: any) => (
                      <tr key={p.name + p.in} className="border-b border-gray-100">
                        <td className="py-1 pr-3 font-mono text-xs text-blue-700">{p.name}</td>
                        <td className="py-1 pr-3 text-xs text-gray-500">{p.in}</td>
                        <td className="py-1 pr-3">{p.required ? <span className="text-red-500 text-xs font-bold">yes</span> : <span className="text-gray-500 text-xs">no</span>}</td>
                        <td className="py-1 pr-3 text-xs text-gray-600">{p.schema?.type || 'string'}</td>
                        <td className="py-1 text-xs text-gray-500">
                          {p.description}
                          {p.example && <span className="ml-1 text-gray-500">(e.g. {JSON.stringify(p.example)})</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Responses</h4>
            <div className="space-y-2">
              {statusCodes.map((code) => {
                const resp = responses[code];
                const respSchema = resp.content?.['application/json']?.schema;
                return (
                  <details key={code} className="group">
                    <summary className={`cursor-pointer px-3 py-1.5 rounded text-sm font-mono ${
                      code.startsWith('2') ? 'bg-green-50 text-green-800 hover:bg-green-100' :
                      code.startsWith('3') ? 'bg-blue-50 text-blue-800 hover:bg-blue-100' :
                      code.startsWith('4') ? 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100' :
                      'bg-red-50 text-red-800 hover:bg-red-100'
                    }`}>
                      {code} — {resp.description}
                    </summary>
                    {respSchema && (
                      <div className="mt-2 ml-4">
                        <SchemaTable schema={respSchema} depth={0} />
                      </div>
                    )}
                  </details>
                );
              })}
            </div>
          </div>

          <TryIt path={path} method={method} />

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">cURL Example</h4>
            <pre className="bg-gray-900 text-green-300 text-xs font-mono p-3 rounded overflow-x-auto">
              {generateCurl(path, spec)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function generateCurl(path: string, spec: Record<string, any>): string {
  let url = `${BASE_URL}${path}`;
  const queryParams: string[] = [];
  for (const p of (spec.parameters || []) as Record<string, any>[]) {
    if (p.in === 'path') {
      url = url.replace(`{${p.name}}`, String(p.example || `YOUR_${p.name.toUpperCase()}`));
    } else if (p.in === 'query' && p.example !== undefined) {
      queryParams.push(`${p.name}=${encodeURIComponent(String(p.example))}`);
    }
  }
  if (queryParams.length) url += '?' + queryParams.join('&');
  return `curl "${url}"`;
}

/* ------------------------------------------------------------------ */
/*  Schema Reference                                                   */
/* ------------------------------------------------------------------ */
function SchemaReference() {
  const schemas = openApiSpec.components.schemas as Record<string, any>;
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        These schemas define the structure of objects returned by the API. Fields marked with
        <span className="text-red-500 font-bold ml-1">✓</span> are required.
      </p>
      {Object.entries(schemas).map(([name, schema]: [string, any]) => (
        <div key={name} id={`schema-${name.toLowerCase()}`} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h3 className="text-lg font-semibold font-mono text-gray-800">{name}</h3>
            {schema.description && <p className="text-xs text-gray-500 mt-0.5">{schema.description}</p>}
          </div>
          <div className="p-4">
            <SchemaTable schema={schema} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Endpoint collection helper                                         */
/* ------------------------------------------------------------------ */
function collectEndpoints(): EndpointEntry[] {
  const result: EndpointEntry[] = [];
  const paths = openApiSpec.paths as Record<string, any>;
  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, specRaw] of Object.entries(methods as Record<string, any>)) {
      if (specRaw && typeof specRaw === 'object' && specRaw.summary) {
        result.push({ path, method: method.toUpperCase(), spec: specRaw });
      }
    }
  }
  return result;
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function ApiDocsPage() {
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<EndpointId>>(new Set());
  const [activeSection, setActiveSection] = useState<'endpoints' | 'schemas'>('endpoints');

  const toggleEndpoint = (id: EndpointId) => {
    setExpandedEndpoints((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const endpoints = collectEndpoints();

  // Group by tag
  const tagGroups: Record<string, EndpointEntry[]> = {};
  for (const ep of endpoints) {
    const tag = ep.spec.tags?.[0] || 'Other';
    if (!tagGroups[tag]) tagGroups[tag] = [];
    tagGroups[tag].push(ep);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">{openApiSpec.info.title}</h1>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">v{openApiSpec.info.version}</span>
        </div>
        <p className="text-gray-600">{openApiSpec.info.description}</p>
        <div className="mt-3 flex items-center gap-4 text-sm">
          <span className="text-gray-500">
            Base URL: <code className="bg-gray-200 px-2 py-0.5 rounded text-xs text-gray-800">{BASE_URL}</code>
          </span>
          <a
            href="/api/v1/openapi.json"
            className="text-blue-700 underline hover:text-blue-800 text-xs"
            target="_blank"
            rel="noreferrer"
          >
            OpenAPI JSON ↗
          </a>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-1">Rate Limiting</h3>
          <p className="text-sm text-blue-700">100 requests/min per IP</p>
          <p className="text-xs text-blue-600 mt-1">
            Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
          </p>
        </div>
        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-1">Response Format</h3>
          <p className="text-sm text-green-700">JSON with CORS headers</p>
          <p className="text-xs text-green-800 mt-1">
            Envelope: <code>{'{ "data": [...], "meta": {...} }'}</code>
          </p>
        </div>
        <div className="border border-purple-200 bg-purple-50 rounded-lg p-4">
          <h3 className="font-semibold text-purple-800 mb-1">Authentication</h3>
          <p className="text-sm text-purple-700">None required (public API)</p>
          <p className="text-xs text-purple-600 mt-1">
            Optional X-API-Key header for future premium tier
          </p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveSection('endpoints')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeSection === 'endpoints'
              ? 'text-blue-700 border-b-2 border-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Endpoints ({endpoints.length})
        </button>
        <button
          onClick={() => setActiveSection('schemas')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeSection === 'schemas'
              ? 'text-blue-700 border-b-2 border-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Schemas ({Object.keys(openApiSpec.components.schemas).length})
        </button>
      </div>

      {/* Endpoints */}
      {activeSection === 'endpoints' && (
        <div className="space-y-8">
          {Object.entries(tagGroups).map(([tag, eps]) => (
            <div key={tag}>
              <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
                {tag}
              </h2>
              <div className="space-y-2">
                {eps.map((ep) => {
                  const id = `${ep.path}-${ep.method}`;
                  return (
                    <EndpointCard
                      key={id}
                      path={ep.path}
                      method={ep.method}
                      spec={ep.spec}
                      expanded={expandedEndpoints.has(id)}
                      onToggle={() => toggleEndpoint(id)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schemas */}
      {activeSection === 'schemas' && <SchemaReference />}

      {/* Error Codes */}
      <div className="mt-12 border-t border-gray-200 pt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Error Codes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 font-medium text-gray-600">Code</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-600">HTTP Status</th>
                <th className="text-left py-2 font-medium text-gray-600">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4 font-mono text-xs text-blue-700">INVALID_PARAM</td>
                <td className="py-2 pr-4">400</td>
                <td className="py-2 text-gray-600">Invalid or missing request parameter</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4 font-mono text-xs text-blue-700">NOT_FOUND</td>
                <td className="py-2 pr-4">404</td>
                <td className="py-2 text-gray-600">Requested resource does not exist</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4 font-mono text-xs text-blue-700">RATE_LIMIT_EXCEEDED</td>
                <td className="py-2 pr-4">429</td>
                <td className="py-2 text-gray-600">Too many requests — slow down and retry after the reset time</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4 font-mono text-xs text-blue-700">INTERNAL_ERROR</td>
                <td className="py-2 pr-4">500</td>
                <td className="py-2 text-gray-600">Unexpected server error — please retry later</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
        <p>
          Generated from{' '}
          <a href="/api/v1/openapi.json" className="text-blue-700 underline hover:text-blue-800">
            OpenAPI 3.0.3 spec
          </a>
          . Licensed under{' '}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" className="text-blue-700 underline hover:text-blue-800" target="_blank" rel="noreferrer">
            CC BY-SA 4.0
          </a>
          .
        </p>
      </div>
    </div>
  );
}
