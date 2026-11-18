// 센서 최신값을 플랫폼 API에서 모아 정적 JSON 두 개로 쓴다. 서버(api.service.ts)의 getData/getSensors 응답과 같은 모양이다.
// 필요한 환경변수: API_HOST(측정값 조회 URL), API_AUTH(Basic 인증 값). 외부 의존성 없이 Node 18+ 의 fetch 만 쓴다.
// 하나라도 실패하면 아무것도 쓰지 않고 종료 코드 1 로 끝난다(이전에 게시된 파일이 낡은 채로 남는 쪽이 부분 갱신보다 낫다).
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const outDir = join(process.env.OUT_DIR ?? join(root, 'site'), 'data');
const { API_HOST, API_AUTH } = process.env;
if (!API_HOST || !API_AUTH) {
  console.error('API_HOST 와 API_AUTH 환경변수가 필요하다.');
  process.exit(2);
}

const { sensors } = JSON.parse(
  await readFile(join(root, 'sensorInfo.json'), 'utf8'),
);

const callApi = async (source, fragment) => {
  const url =
    `${API_HOST}?dateFrom=1970-01-01T00:00:00Z&pageSize=1&revert=true` +
    `&source=${encodeURIComponent(source)}` +
    `&valueFragmentType=${encodeURIComponent(fragment)}`;
  const res = await fetch(url, {
    headers: {
      'Content-type': 'application/json',
      Authorization: `Basic ${API_AUTH}`,
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`${source}/${fragment}: HTTP ${res.status}`);
  return res.json();
};

const jobs = sensors.flatMap((s) =>
  s.fragment.map((f) => callApi(s.source, f)),
);
const results = await Promise.allSettled(jobs);
const failed = results.filter((r) => r.status === 'rejected');
if (failed.length) {
  for (const r of failed) console.error(String(r.reason));
  console.error(`${failed.length}/${results.length} 호출 실패 — 파일을 쓰지 않는다.`);
  process.exit(1);
}

// api.service.ts getData() 와 같은 변환. 값이 없으면 0 으로 둔다.
const num = (v) => v?.value ?? 0;
const data = {};
for (const { value: body } of results) {
  const m = body?.measurements?.[0];
  if (!m) continue;
  const id = m.source.id;
  const dto = (data[id] ??= {});
  if (m.Humid)
    dto.humid = { celsius: num(m.Humid.Celsius), humidity: num(m.Humid.Humidity) };
  if (m.PM) dto.pm = { pm25: num(m.PM.PM2_5), pm10: num(m.PM.PM10) };
  if (m.CO2) dto.co2 = { co2: num(m.CO2.Instantaneous) };
  if (m.voc) dto.voc = { voc: num(m.voc.voc) };
  dto.sourceId = id;
  dto.time = m.time;
}
for (const s of sensors) if (data[s.source]) data[s.source].title = s.name;

await mkdir(outDir, { recursive: true });
const write = async (name, body) => {
  const tmp = join(outDir, `.${name}.tmp`);
  await writeFile(tmp, JSON.stringify(body));
  await rename(tmp, join(outDir, name)); // 읽는 쪽이 반쯤 쓴 파일을 보지 않게 교체한다.
};
await write('sensors.json', { statusCode: 200, data: sensors });
await write('data.json', {
  statusCode: 200,
  generatedAt: new Date().toISOString(),
  data,
});
console.log(
  `OK sensors=${sensors.length} withData=${Object.keys(data).length} -> ${outDir}`,
);
