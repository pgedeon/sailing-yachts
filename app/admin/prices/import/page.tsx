export const dynamic = 'force-dynamic';

import { requireAdmin } from "@/lib/admin-auth";
import Link from "next/link";

export const metadata = { title: "Import Prices — Admin" };

export default async function ImportPricesPage() {
  await requireAdmin();
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import Prices from CSV</h1>
        <p className="text-sm text-gray-500 mt-1">Upload a CSV file with price data or paste rows below.</p>
      </div>

      {/* CSV Format Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-2">CSV Format</h3>
        <p className="text-sm text-blue-800 mb-2">Required columns: <code className="bg-blue-100 px-1 rounded">yacht_model_id</code>, <code className="bg-blue-100 px-1 rounded">price_min</code>, <code className="bg-blue-100 px-1 rounded">price_max</code>, <code className="bg-blue-100 px-1 rounded">source</code></p>
        <p className="text-sm text-blue-800 mb-2">Optional columns: <code className="bg-blue-100 px-1 rounded">currency</code>, <code className="bg-blue-100 px-1 rounded">condition</code>, <code className="bg-blue-100 px-1 rounded">year</code>, <code className="bg-blue-100 px-1 rounded">source_type</code>, <code className="bg-blue-100 px-1 rounded">source_url</code>, <code className="bg-blue-100 px-1 rounded">confidence_score</code>, <code className="bg-blue-100 px-1 rounded">notes</code></p>
        <pre className="text-xs text-blue-700 bg-blue-100 rounded p-2 mt-2 overflow-x-auto">{`yacht_model_id,price_min,price_max,source,currency,condition,year,confidence_score
1,150000,200000,Manufacturer Website,USD,new,2026,75
2,80000,120000,YachtWorld,USD,used,,60`}</pre>
      </div>

      {/* File Upload */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Upload CSV File</h3>
        <input type="file" id="csv-file" accept=".csv" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        <div id="file-info" className="mt-2 text-sm text-gray-500"></div>
      </div>

      {/* Manual Paste */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Or Paste CSV Data</h3>
        <textarea
          id="csv-paste"
          rows={6}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
          placeholder="Paste CSV data here (header row required)"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <button
          id="import-btn"
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          Import Prices
        </button>
        <Link
          href="/admin/prices"
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>

      {/* Results */}
      <div id="import-results" className="hidden bg-white shadow rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-3">Import Results</h3>
        <div id="import-summary" className="text-sm"></div>
        <div id="import-errors" className="mt-3 text-sm text-red-700 hidden"></div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        function parseCsv(text) {
          var lines = text.trim().split('\\n');
          if (lines.length < 2) return [];
          var headers = lines[0].split(',').map(function(h) { return h.trim().toLowerCase().replace(/\\s+/g, '_'); });
          var rows = [];
          for (var i = 1; i < lines.length; i++) {
            var vals = lines[i].split(',');
            if (vals.length < headers.length) continue;
            var row = {};
            headers.forEach(function(h, j) { row[h] = vals[j] ? vals[j].trim() : ''; });
            rows.push(row);
          }
          return rows;
        }

        document.getElementById('import-btn').addEventListener('click', function() {
          var btn = this;
          btn.disabled = true;
          btn.textContent = 'Importing...';

          var fileInput = document.getElementById('csv-file');
          var pasteInput = document.getElementById('csv-paste');

          if (fileInput.files.length > 0) {
            var reader = new FileReader();
            reader.onload = function(e) {
              var rows = parseCsv(e.target.result);
              doImport(rows);
            };
            reader.readAsText(fileInput.files[0]);
          } else if (pasteInput.value.trim()) {
            var rows = parseCsv(pasteInput.value);
            doImport(rows);
          } else {
            alert('Please upload a CSV file or paste CSV data.');
            btn.disabled = false;
            btn.textContent = 'Import Prices';
          }
        });

        function doImport(rows) {
          if (rows.length === 0) {
            alert('No valid rows found.');
            document.getElementById('import-btn').disabled = false;
            document.getElementById('import-btn').textContent = 'Import Prices';
            return;
          }
          fetch('/api/prices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'import', rows: rows })
          })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            var results = document.getElementById('import-results');
            results.classList.remove('hidden');
            document.getElementById('import-summary').innerHTML =
              '<div class=\"flex gap-4\"><span class=\"text-green-700 font-medium\">✅ Imported: ' + data.imported + '</span>' +
              '<span class=\"text-yellow-700 font-medium\">⚠️ Skipped: ' + data.skipped + '</span></div>';
            if (data.errors && data.errors.length > 0) {
              var errDiv = document.getElementById('import-errors');
              errDiv.classList.remove('hidden');
              errDiv.innerHTML = '<strong>Errors:</strong><ul class=\"list-disc ml-4 mt-1\">' +
                data.errors.map(function(e) { return '<li>' + e + '</li>'; }).join('') + '</ul>';
            }
            document.getElementById('import-btn').disabled = false;
            document.getElementById('import-btn').textContent = 'Import Prices';
          })
          .catch(function(err) {
            alert('Import failed: ' + err.message);
            document.getElementById('import-btn').disabled = false;
            document.getElementById('import-btn').textContent = 'Import Prices';
          });
        }

        // File info
        document.getElementById('csv-file').addEventListener('change', function() {
          var info = document.getElementById('file-info');
          if (this.files.length > 0) {
            info.textContent = 'Selected: ' + this.files[0].name + ' (' + (this.files[0].size / 1024).toFixed(1) + ' KB)';
          } else {
            info.textContent = '';
          }
        });
      `}} />

      <div className="mt-4">
        <Link href="/admin/prices" className="text-sm text-blue-600 hover:text-blue-800">← Back to Prices</Link>
      </div>
    </div>
  );
}
