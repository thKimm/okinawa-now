# 🐳 Okinawa Now 🏝️

우리의 오키나와 여행을 위한 **즉흥 여행 지도 웹앱**입니다.

일정을 먼저 확정하는 앱이 아니라, 여행 중에 다음 질문에 바로 답하도록 만들었습니다.

- 지금 내 주변에 저장해 둔 맛집이 뭐가 있지?
- 밥보다 바다나 경치 좋은 곳에 가고 싶은데?
- 비가 오니 쇼핑이나 실내 장소를 볼까?
- 고민하기 싫은데 지금 갈 곳을 세 군데만 골라줘.

## 핵심 기능

- 🗺️ Leaflet + OpenStreetMap 기반 모바일 지도
- 📍 현재 위치 기준 거리순 정렬
- 🍜 🍣 🥩 ☕ 🏖️ 🤿 🛍️ 장소 성격별 이모지 마커
- 남부 / 중부 / 북부 지역 필터
- 밥 / 카페 / 바다·체험 / 경치 / 쇼핑 빠른 필터
- `강력추천`, `추천`, `가고싶음` 정보 표시
- 🎲 **지금 뭐 하지?** 시간대·거리·추천도를 반영한 즉흥 추천
- 💛 저장 / ✅ 방문 완료 상태를 기기 안에 보관
- 🧭 Google Maps 길찾기 바로 열기
- 📱 홈 화면에 추가 가능한 PWA
- 📴 마지막 데이터와 앱 화면의 오프라인 캐시

## 데이터 흐름

```text
Google Sheets
  ├─ 맛집
  ├─ 여행_스팟
  └─ 쇼핑_스팟
       ↓ 5분 CDN 캐시
Vercel Function /api/places
       ↓
Okinawa Now 웹앱
```

기본 데이터 원본은 아래 Google Sheet입니다.

- Sheet ID: `1M99Q4xCDtrT9KLc7vHQNFeydUT6orVf_O0ARIvhnmUI`
- 맛집 gid: `578914801`
- 여행 스팟 gid: `485003184`
- 쇼핑 스팟 gid: `303701298`

사이트를 새로고침하거나 상단의 `↻` 버튼을 누르면 시트의 최신 값이 반영됩니다. 실시간 읽기에 실패하면 `data/fallback.json` 스냅샷을 사용합니다.

> 사이트에는 읽기 권한만 필요합니다. Google Sheet의 공개 공유 권한은 `링크가 있는 사용자: 뷰어`로 낮추는 편이 안전합니다. 시트 편집은 소유 계정과 ChatGPT Google Drive 연결로 계속할 수 있습니다.

## 지도 위치 처리

> v2: 여행 중 외부 geocoder 장애에 영향을 받지 않도록 런타임 Nominatim 자동 호출을 제거했습니다. 지도는 저장된/지역 기반 좌표로 즉시 표시하고 최종 길찾기는 Google Maps로 넘깁니다.


시트에는 주소가 있지만 위도·경도가 없으므로 다음 순서로 처리합니다.

1. 앱을 여는 즉시 지역 중심 기준의 임시 핀을 표시합니다.
2. 추천 장소와 사용자가 선택한 장소를 순차적으로 Nominatim으로 보정합니다.
3. 정확해진 좌표는 브라우저 `localStorage`에 저장합니다.
4. 실제 자동차 이동은 항상 `Google Maps 길찾기` 버튼으로 넘깁니다.

Nominatim을 과도하게 호출하지 않도록 한 기기에서 세션당 보정 수를 제한하고 요청 간격을 둡니다. Vercel CDN에도 결과가 장기 캐시됩니다.

## Vercel 배포

이 프로젝트는 빌드 단계가 없는 정적 웹앱 + Vercel Functions 구조입니다.

1. Vercel에서 **Add New → Project**
2. GitHub의 `thKimm/okinawa-now` 선택
3. Framework Preset은 `Other`
4. Build Command와 Output Directory는 비워 둠
5. Deploy

기본 Sheet ID가 코드에 들어 있으므로 환경변수 없이도 동작합니다. 다른 시트를 쓸 때만 다음 환경변수를 지정합니다.

```text
GOOGLE_SHEET_ID=
GOOGLE_SHEET_RESTAURANTS_GID=
GOOGLE_SHEET_SPOTS_GID=
GOOGLE_SHEET_SHOPPING_SPOTS_GID=
```

Vercel은 Git 저장소를 연결하면 이후 `main`에 push할 때마다 자동 재배포합니다.

## 로컬 확인

정적 화면과 스냅샷 데이터만 확인:

```bash
npm run serve
# http://localhost:4173
```

Vercel Function까지 포함해서 확인하려면 Vercel CLI 설치 후:

```bash
vercel dev
```

검사:

```bash
npm run check
npm test
```

Google Sheet에서 최신 오프라인 스냅샷 생성:

```bash
npm run sync:data
```

GitHub의 **Actions → Refresh fallback data → Run workflow**로도 실행할 수 있습니다.

## 파일 구조

```text
api/
  places.js       Google Sheets → 통합 장소 API
  geocode.js      주소 → 좌표 보정 프록시
lib/
  csv.js          의존성 없는 CSV 파서
  normalize.js    시트별 컬럼을 공통 Place 모델로 변환
data/
  fallback.json   오프라인·장애 시 사용할 현재 DB 스냅샷
index.html        앱 화면
styles.css        오키나와 테마 UI
app.js            지도·필터·추천·저장 기능
service-worker.js PWA 오프라인 캐시
```

## 현재 원칙

- 강제 일정표보다 **현재 위치·기분·날씨에 맞는 선택**을 우선합니다.
- 주소가 확실하지 않은 행은 실제 길찾기 전에 Google Maps 결과를 확인합니다.
- 맛집과 쇼핑 데이터는 기존 Google Sheet를 계속 단일 원본으로 사용합니다.
- 개인의 저장/방문 상태는 서버가 아니라 각 휴대폰에만 저장합니다.


## v3 UX

- 모바일/데스크톱 공통 하단 네비게이션: 지도 / 목록 / 저장 / 추천
- 지도 화면은 목록을 숨겨 지도를 크게 사용
- 목록 화면은 카드 탐색에 집중
- 저장 화면은 즐겨찾기만 필터링
- `🍜 밥`, `☕ 카페·간식`, `맛집` 선택 시 Google Sheet의 음식 대분류를 세부 드롭다운으로 자동 생성
- 상단 검색/필터를 더 컴팩트하게 조정해 지도 공간 확대


## v4 smoother map

- 줌아웃 시 가까운 장소를 자체 lightweight cluster로 묶음
- 확대할수록 클러스터가 개별 이모지 핀으로 자연스럽게 분리
- 현재 화면 밖 핀은 DOM에 만들지 않음
- pan/zoom 중 연속 재렌더링 대신 `moveend/zoomend` 후 한 번만 갱신
- 마커 그림자·애니메이션 paint 비용 축소
- 목록 카드에 `content-visibility` 적용
- 별도 clustering CDN/라이브러리를 추가하지 않음
