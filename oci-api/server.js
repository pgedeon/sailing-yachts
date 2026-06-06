/**
 * Sailboats.fr API Service — runs on OCI
 * 
 * Offloaded from Vercel serverless functions.
 * Handles: analytics, health checks, image coverage, stats.
 * 
 * DB schema: analytics_events(event_type, page, entity_id, entity_type,
 *   session_id, metadata, referrer, user_agent, country, created_at)
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3001;

// Database — Neon connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: true }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    'https://info.sailboats.fr',
    'https://sailboats.fr',
    'https://www.sailboats.fr',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// ─── Health Check ────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const dbLatency = Date.now() - start;
    res.json({ 
      status: 'ok', 
      service: 'sailboats-api',
      db: 'connected',
      dbLatency: `${dbLatency}ms`,
      uptime: process.uptime(),
      version: '1.1.0'
    });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

// ─── Analytics: Collect Events ───────────────────────────────────
// Replaces /api/analytics on Vercel — the highest-volume endpoint
// Client sends: { events: [{ eventType, page, entityId, entityType, sessionId, metadata, referrer }] }
// DB columns:   event_type, page, entity_id, entity_type, session_id, metadata, referrer, user_agent
app.post('/analytics', async (req, res) => {
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'No events provided' });
    }
    
    // Limit batch size
    const batch = events.slice(0, 50);
    
    // Respect Do Not Track
    const dnt = req.headers['dnt'] === '1';
    if (dnt) {
      return res.json({ success: true, processed: 0, dnt: true });
    }
    
    const values = [];
    const placeholders = [];
    let paramIdx = 1;
    
    for (const event of batch) {
      if (!event.eventType) continue;
      
      placeholders.push(
        `($${paramIdx}, $${paramIdx+1}, $${paramIdx+2}, $${paramIdx+3}, $${paramIdx+4}, $${paramIdx+5}, $${paramIdx+6}, $${paramIdx+7})`
      );
      values.push(
        event.eventType,                                                    // event_type
        event.page || '/',                                                  // page
        event.entityId || null,                                             // entity_id
        event.entityType || null,                                           // entity_type
        event.sessionId || 'unknown',                                       // session_id
        event.metadata ? JSON.stringify(event.metadata) : null,             // metadata (jsonb)
        event.referrer || null,                                             // referrer
        req.headers['user-agent'] ? req.headers['user-agent'].substring(0, 500) : null  // user_agent
      );
      paramIdx += 8;
    }
    
    if (placeholders.length === 0) {
      return res.status(400).json({ error: 'No valid events' });
    }
    
    const query = `
      INSERT INTO analytics_events 
        (event_type, page, entity_id, entity_type, session_id, metadata, referrer, user_agent)
      VALUES ${placeholders.join(', ')}
    `;
    
    const result = await pool.query(query, values);
    
    res.json({ 
      success: true, 
      processed: result.rowCount 
    });
  } catch (err) {
    console.error('Analytics insert error:', err.message);
    // If table doesn't exist, silently succeed (mirrors Vercel behavior)
    if (err.message.includes('analytics_events')) {
      return res.json({ success: true, processed: 0, fallback: true });
    }
    res.status(500).json({ error: 'Failed to process events' });
  }
});

// ─── Analytics: Admin Dashboard Data ─────────────────────────────
app.get('/analytics/dashboard', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    
    const [overview, topPages, topYachts, byDay, byType] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*)::int as total_events,
          COUNT(DISTINCT session_id) as unique_sessions,
          COUNT(DISTINCT session_id) as unique_visitors,
          COUNT(DISTINCT DATE(created_at))::int as active_days
        FROM analytics_events 
        WHERE created_at >= NOW() - INTERVAL '1 day' * $1
      `, [days]),
      pool.query(`
        SELECT page, COUNT(*)::int as views
        FROM analytics_events 
        WHERE event_type = 'page_view' 
          AND created_at >= NOW() - INTERVAL '1 day' * $1
        GROUP BY page
        ORDER BY views DESC LIMIT 20
      `, [days]),
      pool.query(`
        SELECT ym.model_name, m.name as manufacturer, COUNT(*)::int as views
        FROM analytics_events ae
        JOIN yacht_models ym ON ae.entity_id = ym.id
        LEFT JOIN manufacturers m ON ym.manufacturer_id = m.id
        WHERE ae.event_type = 'yacht_view'
          AND ae.entity_type = 'yacht'
          AND ae.created_at >= NOW() - INTERVAL '1 day' * $1
        GROUP BY ym.model_name, m.name
        ORDER BY views DESC LIMIT 20
      `, [days]),
      pool.query(`
        SELECT DATE(created_at) as date, COUNT(*)::int as events,
          COUNT(DISTINCT session_id) as sessions
        FROM analytics_events
        WHERE created_at >= NOW() - INTERVAL '1 day' * $1
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, [days]),
      pool.query(`
        SELECT event_type, COUNT(*)::int as count
        FROM analytics_events
        WHERE created_at >= NOW() - INTERVAL '1 day' * $1
        GROUP BY event_type
        ORDER BY count DESC
      `, [days])
    ]);
    
    res.json({
      period: `${days}d`,
      overview: overview.rows[0],
      topPages: topPages.rows,
      topYachts: topYachts.rows,
      byDay: byDay.rows,
      byType: byType.rows
    });
  } catch (err) {
    console.error('Dashboard query error:', err.message);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// ─── Image Coverage Audit (offloaded from Vercel) ────────────────
app.get('/image-coverage', async (req, res) => {
  try {
    const result = await pool.query(`
      WITH image_counts AS (
        SELECT yacht_model_id, COUNT(*)::int as image_count
        FROM images GROUP BY yacht_model_id
      ),
      media_asset_counts AS (
        SELECT yacht_model_id, COUNT(*)::int as media_count
        FROM media_assets GROUP BY yacht_model_id
      )
      SELECT 
        ym.id, ym.model_name, y.name as manufacturer_name, ym.slug, ym.year,
        COALESCE(ym.media_count, 0) as media_count,
        COALESCE(ic.image_count, 0)::int as image_count,
        COALESCE(mac.media_count, 0)::int as media_asset_count,
        (COALESCE(ic.image_count, 0) > 0 OR COALESCE(mac.media_count, 0) > 0) as has_images
      FROM yacht_models ym
      LEFT JOIN manufacturers y ON ym.manufacturer_id = y.id
      LEFT JOIN image_counts ic ON ym.id = ic.yacht_model_id
      LEFT JOIN media_asset_counts mac ON ym.id = mac.yacht_model_id
      ORDER BY y.name, ym.model_name
    `);

    const yachts = result.rows;
    const totalYachts = yachts.length;
    const yachtsWithImages = yachts.filter(y => y.has_images).length;
    const needsAttention = yachts.filter(y => !y.has_images).slice(0, 100);
    
    const manufacturerStats = {};
    for (const yacht of yachts) {
      const mfr = yacht.manufacturer_name || 'Unknown';
      if (!manufacturerStats[mfr]) manufacturerStats[mfr] = { total: 0, withImages: 0, withoutImages: 0 };
      manufacturerStats[mfr].total++;
      if (yacht.has_images) manufacturerStats[mfr].withImages++;
      else manufacturerStats[mfr].withoutImages++;
    }

    res.json({
      stats: {
        totalYachts,
        yachtsWithImages,
        yachtsWithoutImages: totalYachts - yachtsWithImages,
        totalImages: yachts.reduce((s, y) => s + (y.image_count || 0), 0),
        totalMediaAssets: yachts.reduce((s, y) => s + (y.media_asset_count || 0), 0),
        coverageRate: totalYachts > 0 ? Math.round((yachtsWithImages / totalYachts) * 100) : 0,
        manufacturerStats
      },
      needsAttention
    });
  } catch (err) {
    console.error('Image coverage error:', err.message);
    res.status(500).json({ error: 'Failed to compute image coverage audit' });
  }
});

// ─── Stats ───────────────────────────────────────────────────────
app.get('/stats', async (req, res) => {
  try {
    const [yachtCount, mfrCount, imageCount] = await Promise.all([
      pool.query('SELECT COUNT(*)::int as count FROM yacht_models'),
      pool.query('SELECT COUNT(*)::int as count FROM manufacturers'),
      pool.query('SELECT COUNT(*)::int as count FROM images')
    ]);
    
    res.json({
      yachts: yachtCount.rows[0].count,
      manufacturers: mfrCount.rows[0].count,
      images: imageCount.rows[0].count
    });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── Graceful Shutdown ───────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await pool.end();
  process.exit(0);
});

// ─── Start ───────────────────────────────────────────────────────
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Sailboats API listening on http://127.0.0.1:${PORT}`);
  console.log('Endpoints: /health, /analytics, /analytics/dashboard, /image-coverage, /stats');
});
