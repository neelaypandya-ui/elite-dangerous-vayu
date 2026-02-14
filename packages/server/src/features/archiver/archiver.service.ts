/**
 * Journal archiver service.
 * Monitors journal directory, auto-copies to backup, compresses archives.
 */

import { config } from '../../config.js';
import * as fs from 'fs';
import * as path from 'path';

interface BackupRecord {
  sourceFile: string;
  backupPath: string;
  timestamp: string;
  sizeBytes: number;
}

class ArchiverService {
  private backups: BackupRecord[] = [];
  private lastScan = 0;

  getBackupDir(): string {
    return config.backup.dir || path.join(config.paths.journalDir, '..', 'vayu-backups');
  }

  getRetentionDays(): number {
    return config.backup.retentionDays;
  }

  async scanJournals(): Promise<{ total: number; needsBackup: number }> {
    const journalDir = config.paths.journalDir;
    if (!fs.existsSync(journalDir)) return { total: 0, needsBackup: 0 };

    const files = fs.readdirSync(journalDir)
      .filter((f) => f.match(/^Journal\.\d{4}-\d{2}-\d{2}/i) && f.endsWith('.log'));

    const backupDir = this.getBackupDir();
    const backedUp = new Set<string>();
    if (fs.existsSync(backupDir)) {
      for (const f of fs.readdirSync(backupDir)) {
        backedUp.add(f);
      }
    }

    const needsBackup = files.filter((f) => !backedUp.has(f)).length;
    this.lastScan = Date.now();

    return { total: files.length, needsBackup };
  }

  async runBackup(): Promise<{ backed: number; errors: string[] }> {
    const journalDir = config.paths.journalDir;
    const backupDir = this.getBackupDir();
    const errors: string[] = [];
    let backed = 0;

    if (!fs.existsSync(journalDir)) return { backed: 0, errors: ['Journal directory not found'] };
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const files = fs.readdirSync(journalDir)
      .filter((f) => f.match(/^Journal\.\d{4}-\d{2}-\d{2}/i) && f.endsWith('.log'));

    const existing = new Set(fs.readdirSync(backupDir));

    for (const file of files) {
      if (existing.has(file)) continue;
      try {
        const src = path.join(journalDir, file);
        const dst = path.join(backupDir, file);
        fs.copyFileSync(src, dst);
        const stat = fs.statSync(dst);
        this.backups.push({
          sourceFile: file,
          backupPath: dst,
          timestamp: new Date().toISOString(),
          sizeBytes: stat.size,
        });
        backed++;
      } catch (err) {
        errors.push(`Failed to backup ${file}: ${err instanceof Error ? err.message : err}`);
      }
    }

    return { backed, errors };
  }

  getBackupHistory(): BackupRecord[] {
    return [...this.backups].reverse();
  }

  getStatus(): object {
    const backupDir = this.getBackupDir();
    let totalBackups = 0;
    let totalSize = 0;
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir);
      totalBackups = files.length;
      for (const f of files) {
        try {
          totalSize += fs.statSync(path.join(backupDir, f)).size;
        } catch { /* ignore */ }
      }
    }

    return {
      backupDir,
      retentionDays: this.getRetentionDays(),
      totalBackups,
      totalSizeMB: Math.round(totalSize / 1_048_576 * 10) / 10,
      lastScan: this.lastScan ? new Date(this.lastScan).toISOString() : null,
      recentBackups: this.backups.slice(-5).reverse(),
    };
  }
}

export const archiverService = new ArchiverService();
