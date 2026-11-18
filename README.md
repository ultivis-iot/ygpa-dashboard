# ygpa-dashboard

여수광양항만공사 공기질 센서(초미세먼지·미세먼지·이산화탄소·VOC·온도·습도) 현황을 보여 주는 **정적 웹 페이지**다.
서버 없이 동작한다. 주기적으로 센서 최신값을 모아 JSON 파일로 만들고, 화면은 그 파일만 읽는다.

```
예약 실행(10분마다) ─ scripts/collect.mjs ─▶ site/data/*.json ┐
                                                              ├─▶ 정적 호스팅(site/)
scripts/build-site.mjs ─▶ site/ (index.html, js, css, images) ┘
```

## 구성

| 경로 | 설명 |
|---|---|
| `index.html`, `public/` | 화면(HTML·JS·CSS·이미지·글꼴). `public/js/main.js`가 `data/*.json`을 1분마다 다시 읽는다 |
| `sensorInfo.json` | 표시할 센서 목록(장치 ID·이름·읽을 측정 종류·정확도) |
| `scripts/collect.mjs` | 플랫폼 측정값 API에서 센서별 최신값을 모아 `site/data/sensors.json`, `site/data/data.json`을 쓴다 |
| `scripts/build-site.mjs` | `index.html`과 `public/`을 `site/`로 복사한다 |

## 로컬에서 해 보기

외부 의존성이 없고 Node 18 이상이면 된다.

```bash
node scripts/build-site.mjs                      # site/ 생성(기존 site/ 는 지운다)
API_HOST='<측정값 조회 URL>' API_AUTH='<Basic 인증 값>' node scripts/collect.mjs
python3 -m http.server -d site 8080              # http://localhost:8080
```

- `API_HOST`: 측정값 조회 URL(`…/measurement/measurements`). `API_AUTH`: `사용자:비밀번호`를 base64 한 값.
- **인증 값은 저장소에 넣지 않는다.** 로컬에서는 셸 환경변수로, 자동 실행에서는 Actions Secrets로만 넘긴다.
- 빌드는 `site/`를 지우므로 **빌드를 먼저, 수집을 나중에** 한다.
- 호출이 하나라도 실패하면 `collect.mjs`는 파일을 쓰지 않고 종료 코드 1로 끝난다(이전에 게시된 값이 낡더라도 일부만 갱신된 값을 보이지 않게).

## 동작 방식

- 센서마다 `sensorInfo.json`의 `fragment`(Humid·PM·CO2·voc)별로 가장 최근 측정값 1건을 읽는다.
- 값이 없는 센서는 화면에서 건너뛴다. 한 센서가 깨져도 나머지는 그린다.
- 카드의 "마지막 업데이트"는 해당 센서의 마지막 측정 시각이다.

## 글꼴

`public/fonts/`의 나눔고딕은 네이버 나눔글꼴이며 무료로 사용할 수 있다.
