import { workspace } from 'coc.nvim';

import cp from 'child_process';
import fs from 'fs';
import path from 'path';

export function getArtisanPath() {
  try {
    const artisanPath = path.join(workspace.root, 'artisan');
    if (fs.existsSync(artisanPath)) {
      return artisanPath;
    }
  } catch {
    return undefined;
  }
}

/**
 * @param code - Receive a code that uses "single" quotes
 * @param artisanPath - Path to artisan command
 */
export async function runTinker(code: string, artisanPath: string) {
  const r = new Promise<string | undefined>((resolve, reject) => {
    cp.exec(`php "${artisanPath}" tinker --execute="${code}"`, (err, stdout, stderr) => {
      if (err) reject(undefined);

      if (stdout.length > 0) {
        resolve(stdout);
      } else {
        reject(stderr);
      }
    });
  }).catch(() => {
    return undefined;
  });
  return r;
}

export async function runRouteListJson(artisanPath: string) {
  const r = new Promise<string | undefined>((resolve, reject) => {
    cp.exec(`php "${artisanPath}" route:list --json`, (err, stdout, stderr) => {
      if (err) reject(undefined);

      if (stdout.length > 0) {
        resolve(stdout);
      } else {
        reject(stderr);
      }
    });
  }).catch(() => {
    return undefined;
  });
  return r;
}
