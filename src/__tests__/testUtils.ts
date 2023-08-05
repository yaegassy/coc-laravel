import cp from 'child_process';
import fs from 'fs';
import path from 'path';

export function printDebug(data: any) {
  console.log(`==DEBUG==: ${JSON.stringify(data, null, 2)}`);
}

export function stripInitialNewline(text: string) {
  return text.replace(/^\n/, '');
}

export function getArtisanPath(rootDir: string) {
  try {
    const artisanPath = path.join(rootDir, 'artisan');
    if (fs.existsSync(artisanPath)) {
      return artisanPath;
    }
  } catch {
    return undefined;
  }
}

export const TEST_LV_PROJECT_PATH = path.resolve(__dirname, '../../laravel-project');

export function getPhpPath() {
  return 'php';
}

/**
 * @param code - Receive a code that uses "single" quotes
 * @param artisanPath - Path to artisan command
 */
export async function runTinker(code: string, artisanPath: string) {
  const phpPath = getPhpPath();

  const r = new Promise<string | undefined>((resolve, reject) => {
    cp.exec(`"${phpPath}" "${artisanPath}" tinker --execute="${code}"`, (err, stdout, stderr) => {
      if (err) {
        console.log(err);
        reject(undefined);
      }

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
