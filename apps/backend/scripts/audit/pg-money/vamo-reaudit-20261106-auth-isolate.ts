import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
const isEnv = (p: unknown) => /(?:^|[\\/])\.env(?:[.\\/]|$)/.test(String(p));
const originalSync = fs.readFileSync;
(fs as any).readFileSync = function(p: unknown, options: any, ...rest: any[]) {
  if (isEnv(p)) return typeof options === 'string' || options?.encoding ? '' : Buffer.alloc(0);
  return (originalSync as any).call(this, p, options, ...rest);
};
const originalRead = fs.readFile;
(fs as any).readFile = function(p: unknown, ...args: any[]) {
  if (!isEnv(p)) return (originalRead as any).call(this, p, ...args);
  const cb = args.at(-1);
  const options = args[0];
  queueMicrotask(() => cb(null, typeof options === 'string' || options?.encoding ? '' : Buffer.alloc(0)));
};
const originalPromiseRead = fs.promises.readFile;
(fs.promises as any).readFile = async function(p: unknown, options: any) {
  if (isEnv(p)) return typeof options === 'string' || options?.encoding ? '' : Buffer.alloc(0);
  return (originalPromiseRead as any).call(this, p, options);
};
syncBuiltinESMExports();
