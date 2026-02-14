/**
 * @vayu/server — Main Entry Point
 *
 * Boots the VAYU server:
 *   1. Loads configuration from environment / .env
 *   2. Initialises the SQLite database
 *   3. Creates the Express HTTP application
 *   4. Starts the HTTP server
 *   5. Attaches the WebSocket server
 *   6. Registers graceful shutdown handlers
 *
 * Run with:
 *   node dist/index.js          (production)
 *   npx tsx watch src/index.ts  (development)
 */

import { createApp } from './app.js';
import { wsManager } from './websocket.js';
import { initDatabase, closeDatabase } from './database/index.js';
import { config } from './config.js';
import { journalWatcher, statusWatcher, companionWatcher } from './core/index.js';
import './core/game-state.js'; // registers event handlers on import

// ---------------------------------------------------------------------------
// Global error handlers — catch unhandled errors to prevent silent crashes
// ---------------------------------------------------------------------------

process.on('unhandledRejection', (reason: unknown) => {
  console.error('[KAVACH] Unhandled promise rejection:', reason);
  // Do NOT exit — log and continue. The rejection is already lost,
  // but crashing would be worse for a companion app.
});

process.on('uncaughtException', (err: Error) => {
  console.error('[KAVACH] Uncaught exception:', err);
  // For truly unexpected errors we log but stay alive.
  // The global Express error handler catches route-level throws;
  // this catches everything else (timers, event emitters, etc.).
});

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log();
  console.log('VAYU -- Elite Dangerous Cockpit Voice Assistant');
  console.log('================================================');
  console.log();

  // -- Database --
  await initDatabase(config.paths.databasePath);
  console.log('[db]  Database initialised');

  // -- Express --
  const app = createApp();
  console.log('[http] Express app created');

  // -- HTTP server --
  const server = app.listen(config.server.port, () => {
    console.log(`[http] Server listening on http://localhost:${config.server.port}`);
  });

  // Handle EADDRINUSE — another process (or a previous VAYU instance) is
  // already using this port. Log a helpful message instead of crashing with
  // an unreadable stack trace.
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[KAVACH] Port ${config.server.port} is already in use.`);
      console.error('  Another VAYU instance may be running, or another application is using this port.');
      console.error(`  Either stop the other process or change SERVER_PORT in your .env file.\n`);
      process.exit(1);
    }
    // Re-throw other listen errors so they are not silently swallowed
    throw err;
  });

  // -- WebSocket --
  wsManager.init(server);
  console.log('[ws]  WebSocket server attached');

  // -- Journal Watchers --
  await journalWatcher.start(config.paths.journalDir);
  console.log('[journal] Journal watcher started');

  await statusWatcher.start(config.paths.journalDir);
  console.log('[status] Status watcher started');

  await companionWatcher.start(config.paths.journalDir);
  console.log('[companion] Companion file watcher started');

  // -- Startup summary --
  console.log();
  console.log('Configuration:');
  console.log(`  Journal dir:  ${config.paths.journalDir}`);
  console.log(`  Database:     ${config.paths.databasePath}`);
  console.log(`  Client port:  ${config.server.clientPort}`);
  console.log(`  EDSM cmdr:   ${config.api.edsmCommanderName}`);
  console.log(`  Whisper:      ${config.whisper.model} (${config.whisper.language})`);
  console.log();
  console.log('Ready. Waiting for connections...');
  console.log();

  // -- Graceful shutdown --
  const shutdown = (signal: string) => {
    console.log(`\n${signal} received — shutting down gracefully...`);

    // Stop watchers
    journalWatcher.stop();
    statusWatcher.stop();
    companionWatcher.stop();

    // Close WebSocket connections first
    wsManager.close();

    // Close HTTP server (stop accepting new connections)
    server.close(() => {
      console.log('[http] Server closed');

      // Persist and close database
      closeDatabase(config.paths.databasePath);
      console.log('[db]  Database saved and closed');

      console.log('Goodbye, Commander. o7');
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown stalls
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// ---------------------------------------------------------------------------
// Launch
// ---------------------------------------------------------------------------

main().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
