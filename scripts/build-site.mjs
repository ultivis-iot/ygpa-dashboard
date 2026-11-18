// 정적 사이트(site/)를 만든다: public/* 과 index.html 을 site/ 로 복사한다.
import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const site = process.env.OUT_DIR ?? join(root, 'site');

await rm(site, { recursive: true, force: true });
await mkdir(site, { recursive: true });
await cp(join(root, 'public'), site, { recursive: true });

await cp(join(root, 'index.html'), join(site, 'index.html'));
console.log(`OK ${site}`);
