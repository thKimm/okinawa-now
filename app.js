const SHEET_URL = "https://docs.google.com/spreadsheets/d/1M99Q4xCDtrT9KLc7vHQNFeydUT6orVf_O0ARIvhnmUI/edit";
const STORAGE = {
  data: "okinawa-now:data:v2",
  favorites: "okinawa-now:favorites:v1",
  view: "okinawa-now:view:v3",
  visited: "okinawa-now:visited:v1",
  coords: "okinawa-now:coords:v2",
};

const REGION_ANCHORS = [
  { terms: ["도카시키", "아하렌", "케라마"], lat: 26.1972, lng: 127.3643 },
  { terms: ["코우리", "Kouri"], lat: 26.7037, lng: 128.0174 },
  { terms: ["나키진", "Nakijin"], lat: 26.6825, lng: 127.9727 },
  { terms: ["비세", "Bise"], lat: 26.7052, lng: 127.8792 },
  { terms: ["모토부", "Motobu", "Yamakawa", "Sesoko"], lat: 26.6571, lng: 127.8873 },
  { terms: ["나고", "Nago", "Agarie", "Miyazato", "Biimata"], lat: 26.5915, lng: 127.9773 },
  { terms: ["온나", "Onna", "Maeganeku", "Serakaki", "Fuchaku", "Tancha"], lat: 26.4967, lng: 127.8542 },
  { terms: ["요미탄", "Yomitan", "Gima", "Zakimi", "Takashiho", "Toya", "Uza"], lat: 26.3966, lng: 127.7443 },
  { terms: ["차탄", "Chatan", "Mihama", "Sunabe", "Miyagi", "Hamagawa", "Kitamae", "Ihei"], lat: 26.3154, lng: 127.7582 },
  { terms: ["오키나와시", "Okinawa, Okinawa", "Chuo"], lat: 26.3342, lng: 127.8056 },
  { terms: ["기노완", "Ginowan", "Ojana", "Oyama"], lat: 26.2815, lng: 127.7782 },
  { terms: ["우루마", "Uruma", "Yonashiro"], lat: 26.3794, lng: 127.8575 },
  { terms: ["우라소에", "Urasoe", "Irijima", "Makiminato", "Minatogawa"], lat: 26.2458, lng: 127.7213 },
  { terms: ["난조", "Nanjo", "Tamagusuku", "Chinen"], lat: 26.1441, lng: 127.7672 },
  { terms: ["이토만", "Itoman", "Nishizakicho", "Fukuji"], lat: 26.1239, lng: 127.6662 },
  { terms: ["토미구스쿠", "Tomigusuku", "Senaga", "Toyosaki"], lat: 26.1648, lng: 127.6686 },
  { terms: ["나하", "Naha", "Makishi", "Matsuo", "Kumoji", "Oroku", "Omoromachi", "Minatomachi", "Takara", "Gushi", "Asato", "Shuri"], lat: 26.2124, lng: 127.6809 }
];

const NAMED_COORDS = {
  "호시노야 오키나와 리조트 데이": { lat: 26.4106, lng: 127.7285 },
  "국제거리": { lat: 26.2144, lng: 127.6847 },
  "아메리칸 빌리지": { lat: 26.3152, lng: 127.7568 },
  "아라하 비치": { lat: 26.3042, lng: 127.7587 },
  "마에다곶": { lat: 26.4446, lng: 127.7731 },
  "푸른 동굴": { lat: 26.4448, lng: 127.7727 },
  "오키나와 츄라우미 수족관": { lat: 26.6944, lng: 127.8782 },
  "비세 후쿠기 가로수길": { lat: 26.7051, lng: 127.8778 },
  "잔파곶·잔파곶 등대": { lat: 26.4386, lng: 127.7140 },
  "우미카지 테라스": { lat: 26.1746, lng: 127.6467 },
  "나하공항": { lat: 26.2064, lng: 127.6467 },
  "코우리섬": { lat: 26.7037, lng: 128.0174 },
  "세소코 비치": { lat: 26.6358, lng: 127.8655 },
  "만좌모": { lat: 26.5049, lng: 127.8503 },
  "쿄다 휴게소": { lat: 26.5561, lng: 127.9525 },
  "쿄다 휴게소·얀바루 물산센터": { lat: 26.5561, lng: 127.9525 }
};

const QUICK_LABELS = {
  all: "모든 장소",
  recommended: "추천 장소",
  nearby: "현재 위치 주변",
  food: "밥집",
  cafe: "카페·간식",
  ocean: "바다·체험",
  scenery: "경치 좋은 곳",
  shopping: "쇼핑",
  favorites: "저장한 곳",
  visited: "다녀온 곳"
};

const state = {
  map: null,
  markerLayer: null,
  markers: new Map(),
  userMarker: null,
  userAccuracyCircle: null,
  places: [],
  filtered: [],
  selectedId: null,
  kind: "all",
  quick: "all",
  foodCategory: "all",
  region: "all",
  search: "",
  sort: "smart",
  visibleCount: 28,
  userLocation: null,
  favorites: loadSet(STORAGE.favorites),
  visited: loadSet(STORAGE.visited),
  coords: loadObject(STORAGE.coords),
  source: "loading",
  generatedAt: "",
  installPrompt: null,
  mobileView: localStorage.getItem(STORAGE.view) || "map",
  toastTimer: null
};

const els = {};

function loadSet(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return new Set(Array.isArray(value) ? value : []);
  } catch {
    return new Set();
  }
}

function loadObject(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function saveSet(key, set) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

function saveCoords() {
  localStorage.setItem(STORAGE.coords, JSON.stringify(state.coords));
}

function e(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value, fallback = "#") {
  try {
    const url = new URL(value, window.location.origin);
    if (["http:", "https:"].includes(url.protocol)) return url.href;
  } catch {
    // Ignore malformed URLs from sheet data.
  }
  return fallback;
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function cacheData(payload) {
  try {
    localStorage.setItem(STORAGE.data, JSON.stringify(payload));
  } catch {
    // Safari private mode or storage quota; app remains usable.
  }
}

function getCachedData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.data) || "null");
  } catch {
    return null;
  }
}

function initElements() {
  [
    "refreshButton", "installButton", "searchInput", "clearSearchButton", "kindFilters",
    "quickFilters", "foodCategoryFilter", "foodCategorySelect", "foodCategoryLabel",
    "regionFilters", "surpriseButton", "mobileSurpriseButton", "map", "dataStatus", "dataStatusText",
    "locateButton", "fitButton", "listKicker",
    "resultCount", "sortSelect", "activeSummary", "placeList", "loadMoreButton", "detailBackdrop",
    "detailSheet", "detailCloseButton", "detailContent", "surpriseBackdrop", "surpriseModal",
    "surpriseCloseButton", "surpriseResults", "rerollButton", "toast"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function initFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const kind = params.get("kind");
  const quick = params.get("quick");
  if (["all", "restaurant", "spot", "shop"].includes(kind)) state.kind = kind;
  if (Object.hasOwn(QUICK_LABELS, quick)) state.quick = quick;
}

function initMap() {
  if (!window.L) {
    showToast("지도를 불러오지 못했어요. 인터넷 연결을 확인해주세요.");
    return;
  }

  state.map = L.map("map", {
    zoomControl: true,
    minZoom: 8,
    maxZoom: 18,
    preferCanvas: true
  }).setView([26.44, 127.86], 9);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(state.map);

  state.markerLayer = L.layerGroup().addTo(state.map);
}

async function loadPlaces({ force = false } = {}) {
  setDataStatus("loading", "Google Sheet 동기화 중");
  els.refreshButton.classList.add("is-spinning");

  let payload = null;
  let source = "";

  try {
    const response = await fetch(`/api/places${force ? `?refresh=${Date.now()}` : ""}`, {
      cache: force ? "no-store" : "default"
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    payload = await response.json();
    source = "live";
    cacheData(payload);
  } catch (liveError) {
    console.warn("Live data unavailable", liveError);
    try {
      const response = await fetch("/data/fallback.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`Snapshot ${response.status}`);
      payload = await response.json();
      source = "snapshot";
    } catch (snapshotError) {
      console.warn("Snapshot unavailable", snapshotError);
      payload = getCachedData();
      source = payload ? "cache" : "error";
    }
  }

  els.refreshButton.classList.remove("is-spinning");

  if (!payload?.places?.length) {
    state.places = [];
    setDataStatus("offline", "데이터를 불러오지 못함");
    render();
    showToast("데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
    return;
  }

  state.places = payload.places.map(sanitizePlace);
  state.source = source;
  state.generatedAt = payload.generatedAt || "";
  state.visibleCount = 28;

  if (source === "live") {
    setDataStatus("live", `시트 연동 · ${state.places.length}곳`);
  } else if (source === "snapshot") {
    setDataStatus("offline", `저장본 사용 · ${state.places.length}곳`);
  } else {
    setDataStatus("offline", `오프라인 캐시 · ${state.places.length}곳`);
  }

  render();
}

function sanitizePlace(place) {
  const safe = {};
  [
    "id", "kind", "name", "nativeName", "emoji", "category", "region", "area", "address",
    "mapUrl", "summary", "hours", "reservation", "parking", "note", "verification", "source",
    "tripRecommendation", "recommendedDay", "recommendationRole", "status", "duration"
  ].forEach((key) => {
    safe[key] = clean(place[key]);
  });
  safe.priority = Number.isFinite(Number(place.priority)) ? Number(place.priority) : 3;
  safe.id = safe.id || `${safe.kind}-${hashCode(`${safe.name}|${safe.address}`)}`;
  safe.emoji = safe.emoji || "📍";
  safe.kind = ["restaurant", "spot", "shop"].includes(safe.kind) ? safe.kind : "spot";
  return safe;
}

function setDataStatus(mode, text) {
  els.dataStatus.classList.toggle("is-live", mode === "live");
  els.dataStatus.classList.toggle("is-offline", mode === "offline");
  els.dataStatusText.textContent = text;
}

function hashCode(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function approximateCoordinate(place) {
  const named = NAMED_COORDS[place.name];
  if (named) return { ...named, exact: true, source: "seed" };

  const haystack = `${place.region} ${place.area} ${place.address} ${place.name}`;
  const anchor = REGION_ANCHORS.find((item) => item.terms.some((term) => haystack.includes(term))) || {
    lat: 26.44,
    lng: 127.86
  };
  const hash = hashCode(place.id);
  const angle = ((hash % 360) * Math.PI) / 180;
  const ring = 0.003 + ((hash >> 4) % 7) * 0.00125;
  return {
    lat: anchor.lat + Math.sin(angle) * ring,
    lng: anchor.lng + Math.cos(angle) * ring,
    exact: false,
    source: "area"
  };
}

function coordinateFor(place) {
  const cached = state.coords[place.id];
  if (cached && Number.isFinite(cached.lat) && Number.isFinite(cached.lng)) {
    return { lat: cached.lat, lng: cached.lng, exact: true, source: cached.source || "geocode" };
  }
  return approximateCoordinate(place);
}


function isCafeCategory(place) {
  return /(카페|디저트|베이커리|브런치)/.test(place.category) ||
    /간식|아이스크림|스무디|커피|도넛|빙수|쿠키|과자/.test(place.summary);
}

function foodCategoryMode() {
  if (state.quick === "food") return "food";
  if (state.quick === "cafe") return "cafe";
  if (state.kind === "restaurant") return "restaurant";
  return "";
}

function updateFoodCategoryOptions() {
  if (!els.foodCategoryFilter || !els.foodCategorySelect) return;
  const mode = foodCategoryMode();
  els.foodCategoryFilter.hidden = !mode;

  if (!mode) {
    state.foodCategory = "all";
    return;
  }

  const categories = [...new Set(
    state.places
      .filter((place) => place.kind === "restaurant")
      .filter((place) => {
        if (mode === "food") return !isCafeCategory(place) && !/다이닝바/.test(place.category);
        if (mode === "cafe") return isCafeCategory(place);
        return true;
      })
      .map((place) => place.category)
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "ko"));

  els.foodCategoryLabel.textContent =
    mode === "food" ? "🍚 밥 종류" : mode === "cafe" ? "☕ 간식 종류" : "🍽️ 음식 종류";

  const allLabel =
    mode === "food" ? "전체 밥 종류" : mode === "cafe" ? "전체 카페·간식" : "전체 음식";

  els.foodCategorySelect.innerHTML = [
    `<option value="all">${allLabel}</option>`,
    ...categories.map((category) => `<option value="${e(category)}">${e(category)}</option>`)
  ].join("");

  if (state.foodCategory !== "all" && !categories.includes(state.foodCategory)) {
    state.foodCategory = "all";
  }
  els.foodCategorySelect.value = state.foodCategory;
}

function setAppView(view) {
  state.mobileView = view;
  localStorage.setItem(STORAGE.view, view);

  if (view === "saved") {
    state.quick = "favorites";
  } else if (view === "list" && state.quick === "favorites") {
    state.quick = "all";
  }

  document.body.classList.toggle("view-map", view === "map");
  document.body.classList.toggle("view-list", view === "list" || view === "saved");

  document.querySelectorAll(".mobile-nav-button[data-view]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === view);
  });

  render();

  if (view === "map") {
    setTimeout(() => {
      state.map?.invalidateSize();
      fitFilteredPlaces();
    }, 80);
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function filterPlaces() {
  const query = state.search.toLocaleLowerCase("ko-KR");
  let places = state.places.filter((place) => {
    const excluded = place.status === "제외" || place.tripRecommendation === "제외추천";
    if (excluded && !state.favorites.has(place.id) && state.quick !== "visited") return false;
    if (state.kind !== "all" && place.kind !== state.kind) return false;
    if (state.region !== "all" && place.region !== state.region) return false;

    if (query) {
      const searchable = [
        place.name, place.nativeName, place.category, place.region, place.area, place.summary,
        place.note, place.address, place.recommendationRole
      ].join(" ").toLocaleLowerCase("ko-KR");
      if (!searchable.includes(query)) return false;
    }

    let quickMatched = true;
    switch (state.quick) {
      case "recommended":
        quickMatched = ["강력추천", "추천", "날씨대안"].includes(place.tripRecommendation) || place.priority === 1;
        break;
      case "nearby":
        quickMatched = state.userLocation ? distanceTo(place) <= 25 : true;
        break;
      case "food":
        quickMatched = place.kind === "restaurant" && !isCafeCategory(place) && !/다이닝바/.test(place.category);
        break;
      case "cafe":
        quickMatched = isCafeCategory(place);
        break;
      case "ocean":
        quickMatched = /(해양|해변|수족관|섬·드라이브|리조트)/.test(place.category) || /스노클|바다|해안|수영/.test(place.summary);
        break;
      case "scenery":
        quickMatched = /(전망|드라이브|거리·자연|리조트)/.test(place.category) || /뷰|절경|선셋|일몰|풍경/.test(`${place.summary} ${place.note}`);
        break;
      case "shopping":
        quickMatched = place.kind === "shop" || /쇼핑|시장·푸드센터/.test(place.category);
        break;
      case "favorites":
        quickMatched = state.favorites.has(place.id);
        break;
      case "visited":
        quickMatched = state.visited.has(place.id);
        break;
      default:
        quickMatched = true;
    }
    if (!quickMatched) return false;

    if (state.foodCategory !== "all") {
      if (place.kind !== "restaurant" || place.category !== state.foodCategory) return false;
    }

    return true;
  });

  places = sortPlaces(places);
  state.filtered = places;
}

function smartScore(place) {
  let score = place.priority * 12;
  if (place.tripRecommendation === "강력추천") score -= 50;
  else if (place.tripRecommendation === "추천") score -= 28;
  else if (place.tripRecommendation === "날씨대안") score -= 10;
  else if (place.tripRecommendation === "낮은우선") score += 18;
  if (place.status === "가고싶음") score -= 8;
  if (state.favorites.has(place.id)) score -= 18;
  if (state.visited.has(place.id)) score += 25;
  if (state.userLocation) score += Math.min(distanceTo(place), 80) * 0.35;
  return score;
}

function sortPlaces(places) {
  return [...places].sort((a, b) => {
    if (state.sort === "name") return a.name.localeCompare(b.name, "ko");
    if (state.sort === "distance") {
      if (!state.userLocation) return smartScore(a) - smartScore(b);
      return distanceTo(a) - distanceTo(b);
    }
    return smartScore(a) - smartScore(b) || a.name.localeCompare(b.name, "ko");
  });
}

function haversineKm(a, b) {
  const toRad = (degree) => (degree * Math.PI) / 180;
  const radius = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const value = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function distanceTo(place) {
  if (!state.userLocation) return Number.POSITIVE_INFINITY;
  return haversineKm(state.userLocation, coordinateFor(place));
}

function formatDistance(place) {
  if (!state.userLocation) return "";
  const coord = coordinateFor(place);
  const distance = haversineKm(state.userLocation, coord);
  const prefix = coord.exact ? "" : "약 ";
  if (distance < 1) return `${prefix}${Math.max(50, Math.round(distance * 1000 / 50) * 50)}m`;
  return `${prefix}${distance < 10 ? distance.toFixed(1) : Math.round(distance)}km`;
}

function render() {
  updateFoodCategoryOptions();
  filterPlaces();
  syncFilterButtons();
  renderSummary();
  renderList();
  renderMarkers();
}

function syncFilterButtons() {
  document.querySelectorAll("[data-kind]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.kind === state.kind);
  });
  document.querySelectorAll("[data-quick]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.quick === state.quick);
  });
  document.querySelectorAll("[data-region]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.region === state.region);
  });
  els.sortSelect.value = state.sort;
}

function renderSummary() {
  els.resultCount.textContent = String(state.filtered.length);
  els.listKicker.textContent = QUICK_LABELS[state.quick] || "즉흥 여행 후보";

  const parts = [];
  if (state.kind !== "all") parts.push({ restaurant: "맛집", spot: "볼거리·체험", shop: "쇼핑" }[state.kind]);
  if (state.region !== "all") parts.push(state.region);
  if (state.foodCategory !== "all") parts.push(state.foodCategory);
  if (state.search) parts.push(`“${state.search}”`);
  if (state.userLocation) parts.push("내 위치 기준");
  els.activeSummary.textContent = parts.length ? `${parts.join(" · ")} 필터 적용 중` : "필터를 누르면 지금 기분에 맞는 장소만 볼 수 있어요.";
}

function renderList() {
  const visible = state.filtered.slice(0, state.visibleCount);
  if (!visible.length) {
    const template = document.getElementById("emptyStateTemplate");
    els.placeList.replaceChildren(template.content.cloneNode(true));
    els.loadMoreButton.hidden = true;
    return;
  }

  els.placeList.innerHTML = visible.map(placeCardHtml).join("");
  els.loadMoreButton.hidden = visible.length >= state.filtered.length;

  els.placeList.querySelectorAll(".place-card").forEach((card) => {
    card.addEventListener("click", () => selectPlace(card.dataset.id, { fly: true, open: true }));
  });

  els.placeList.querySelectorAll("[data-favorite]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFavorite(button.dataset.favorite);
    });
  });
}

function recommendationBadge(place) {
  if (!place.tripRecommendation || ["예비", "낮은우선", "제외추천"].includes(place.tripRecommendation)) return "";
  const strong = place.tripRecommendation === "강력추천" ? " strong" : "";
  return `<span class="recommend-badge${strong}">${e(place.tripRecommendation)}</span>`;
}

function placeCardHtml(place) {
  const distance = formatDistance(place);
  const coord = coordinateFor(place);
  const favorite = state.favorites.has(place.id);
  const visited = state.visited.has(place.id);
  const subtitle = place.nativeName || [place.region, place.area].filter(Boolean).join(" · ");
  const selected = place.id === state.selectedId;

  return `
    <article class="place-card${selected ? " is-selected" : ""}${visited ? " is-visited" : ""}" data-id="${e(place.id)}">
      <div class="place-emoji" aria-hidden="true">${e(place.emoji)}</div>
      <div class="place-main">
        <div class="place-title-row">
          <h3 class="place-title">${e(place.name)}</h3>
          ${recommendationBadge(place)}
        </div>
        <p class="place-subtitle">${e(subtitle)}</p>
        <div class="place-meta">
          <span>📍 ${e([place.region, place.area].filter(Boolean).join(" · ") || "오키나와")}</span>
          ${distance ? `<span>${coord.exact ? "🚗" : "🧭"} ${e(distance)}</span>` : ""}
          ${place.recommendedDay ? `<span>🗓 ${e(place.recommendedDay)}</span>` : ""}
        </div>
        <p class="place-summary">${e(place.summary || place.note || place.category)}</p>
      </div>
      <div class="card-actions">
        <button class="mini-action${favorite ? " is-active" : ""}" type="button" data-favorite="${e(place.id)}" aria-label="${favorite ? "저장 해제" : "저장"}">${favorite ? "💛" : "♡"}</button>
        <span class="mini-action" aria-hidden="true">›</span>
      </div>
    </article>
  `;
}

function markerIcon(place, { selected = false } = {}) {
  const coord = coordinateFor(place);
  const favorite = state.favorites.has(place.id);
  return L.divIcon({
    className: "emoji-marker-wrap",
    html: `<div class="emoji-marker kind-${e(place.kind)}${favorite ? " is-favorite" : ""}${coord.exact ? "" : " is-approximate"}${selected ? " is-selected" : ""}">${e(place.emoji)}</div>`,
    iconSize: [42, 48],
    iconAnchor: [18, 44],
    tooltipAnchor: [3, -39]
  });
}

function renderMarkers() {
  if (!state.map || !state.markerLayer) return;
  state.markerLayer.clearLayers();
  state.markers.clear();

  state.filtered.forEach((place) => {
    const coord = coordinateFor(place);
    const marker = L.marker([coord.lat, coord.lng], {
      icon: markerIcon(place, { selected: place.id === state.selectedId }),
      keyboard: true,
      riseOnHover: true
    });
    marker.bindTooltip(`${place.emoji} ${place.name}`, {
      className: "place-tooltip",
      direction: "top",
      offset: [0, -2]
    });
    marker.on("click", () => selectPlace(place.id, { fly: false, open: true }));
    marker.addTo(state.markerLayer);
    state.markers.set(place.id, marker);
  });
}

function selectPlace(id, { fly = true, open = true } = {}) {
  const place = state.places.find((item) => item.id === id);
  if (!place) return;
  state.selectedId = id;

  if (state.map && fly) {
    const coord = coordinateFor(place);
    state.map.flyTo([coord.lat, coord.lng], Math.max(state.map.getZoom(), coord.exact ? 15 : 12), { duration: 0.65 });
  }

  renderMarkers();
  renderList();
  if (open) openDetail(place);
}

function navigateUrl(place) {
  const destination = [place.nativeName || place.name, place.address].filter(Boolean).join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}

function detailRow(icon, label, value) {
  if (!value) return "";
  return `
    <div class="detail-row">
      <div class="detail-row-icon" aria-hidden="true">${icon}</div>
      <div>
        <span class="detail-row-label">${e(label)}</span>
        <div class="detail-row-value">${e(value)}</div>
      </div>
    </div>
  `;
}

function openDetail(place) {
  const coord = coordinateFor(place);
  const favorite = state.favorites.has(place.id);
  const visited = state.visited.has(place.id);
  const location = [place.region, place.area].filter(Boolean).join(" · ");
  const sourceLink = safeUrl(place.source, "");

  els.detailContent.innerHTML = `
    <div class="detail-hero">
      <div class="detail-emoji" aria-hidden="true">${e(place.emoji)}</div>
      <div>
        <p class="detail-overline">${e(place.category || "오키나와 스팟")}</p>
        <h2 class="detail-title">${e(place.name)}</h2>
        ${place.nativeName ? `<p class="detail-native">${e(place.nativeName)}</p>` : ""}
      </div>
    </div>
    <div class="detail-badges">
      ${place.tripRecommendation ? `<span class="detail-badge${place.tripRecommendation === "강력추천" ? " highlight" : ""}">${e(place.tripRecommendation)}</span>` : ""}
      ${place.recommendedDay ? `<span class="detail-badge">🗓 ${e(place.recommendedDay)}</span>` : ""}
      ${location ? `<span class="detail-badge">📍 ${e(location)}</span>` : ""}
      ${formatDistance(place) ? `<span class="detail-badge">🚗 ${e(formatDistance(place))}</span>` : ""}
    </div>
    <div class="detail-summary">${e(place.summary || place.note || "저장해 둔 오키나와 장소")}</div>
    <div class="detail-grid">
      ${detailRow("💡", "추천 포인트", place.recommendationRole)}
      ${detailRow("🕐", place.kind === "spot" ? "추천 시간" : "영업·이용", place.hours)}
      ${detailRow("🎟️", place.kind === "spot" ? "예약·비용" : "예약", place.reservation)}
      ${detailRow("🚙", "주차·접근", place.parking)}
      ${detailRow("📌", "주소", place.address)}
      ${detailRow("⚠️", "메모·주의", place.note)}
      ${detailRow("🔎", "정보 상태", place.verification)}
    </div>
    ${coord.exact ? "" : `<p class="approximate-note">※ 지도 위 핀은 현재 지역 기준 임시 위치예요. 상세 카드를 연 뒤 잠시 기다리면 정확한 주소로 보정됩니다. 실제 이동은 Google Maps 길찾기를 사용해주세요.</p>`}
    ${sourceLink ? `<p class="approximate-note"><a href="${e(sourceLink)}" target="_blank" rel="noopener noreferrer">정보 출처 보기 ↗</a></p>` : ""}
    <div class="detail-actions">
      <button class="detail-action${favorite ? " is-active" : ""}" type="button" id="detailFavoriteButton">${favorite ? "💛 저장됨" : "♡ 저장"}</button>
      <button class="detail-action${visited ? " is-active" : ""}" type="button" id="detailVisitedButton">${visited ? "✅ 다녀옴" : "✓ 방문"}</button>
      <a class="detail-action primary" href="${e(navigateUrl(place))}" target="_blank" rel="noopener noreferrer">🧭 길찾기</a>
    </div>
  `;

  document.getElementById("detailFavoriteButton")?.addEventListener("click", () => {
    toggleFavorite(place.id);
    openDetail(place);
  });
  document.getElementById("detailVisitedButton")?.addEventListener("click", () => {
    toggleVisited(place.id);
    openDetail(place);
  });

  els.detailBackdrop.hidden = false;
  els.detailSheet.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => els.detailSheet.classList.add("is-open"));
}

function closeDetail() {
  els.detailSheet.classList.remove("is-open");
  els.detailSheet.setAttribute("aria-hidden", "true");
  setTimeout(() => {
    els.detailBackdrop.hidden = true;
  }, 260);
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
    showToast("저장에서 뺐어요");
  } else {
    state.favorites.add(id);
    showToast("여행 후보에 저장했어요 💛");
  }
  saveSet(STORAGE.favorites, state.favorites);
  render();
}

function toggleVisited(id) {
  if (state.visited.has(id)) {
    state.visited.delete(id);
    showToast("방문 표시를 취소했어요");
  } else {
    state.visited.add(id);
    showToast("다녀온 곳으로 표시했어요 ✅");
  }
  saveSet(STORAGE.visited, state.visited);
  render();
}

function fitFilteredPlaces() {
  if (!state.map || !state.filtered.length) return;
  const points = state.filtered.slice(0, 100).map((place) => {
    const coord = coordinateFor(place);
    return [coord.lat, coord.lng];
  });
  if (state.userLocation) points.push([state.userLocation.lat, state.userLocation.lng]);
  const bounds = L.latLngBounds(points);
  state.map.fitBounds(bounds.pad(0.08), { maxZoom: 12, animate: true });
}

function requestLocation({ switchToDistance = true } = {}) {
  if (!navigator.geolocation) {
    showToast("이 브라우저에서는 현재 위치를 사용할 수 없어요.");
    return;
  }

  els.locateButton.disabled = true;
  els.locateButton.innerHTML = "<span class=\"mini-spinner\"></span><span>찾는 중</span>";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      state.userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
      if (switchToDistance) state.sort = "distance";
      renderUserMarker();
      render();
      state.map?.flyTo([state.userLocation.lat, state.userLocation.lng], 12, { duration: 0.7 });
      showToast("현재 위치를 기준으로 가까운 곳을 정렬했어요 📍");
      resetLocateButton();
    },
    (error) => {
      console.warn(error);
      showToast("위치 권한을 허용하면 가까운 곳부터 볼 수 있어요.");
      resetLocateButton();
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 }
  );
}

function resetLocateButton() {
  els.locateButton.disabled = false;
  els.locateButton.innerHTML = "<span aria-hidden=\"true\">◎</span><span>내 위치</span>";
}

function renderUserMarker() {
  if (!state.map || !state.userLocation) return;
  if (state.userMarker) state.userMarker.remove();
  if (state.userAccuracyCircle) state.userAccuracyCircle.remove();
  const icon = L.divIcon({
    className: "",
    html: '<div class="user-location-marker"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
  state.userMarker = L.marker([state.userLocation.lat, state.userLocation.lng], { icon, zIndexOffset: 1000 })
    .bindTooltip("현재 위치", { className: "place-tooltip", direction: "top" })
    .addTo(state.map);
  state.userAccuracyCircle = L.circle([state.userLocation.lat, state.userLocation.lng], {
    radius: Math.min(state.userLocation.accuracy || 100, 1000),
    color: "#1677ff",
    fillColor: "#1677ff",
    fillOpacity: 0.08,
    weight: 1
  }).addTo(state.map);
}

function timeAffinity(place) {
  const hour = new Date().getHours();
  const text = `${place.category} ${place.summary} ${place.hours}`;
  let score = 1;
  if (hour < 10 && /(브런치|베이커리|카페|시장|해변|산책)/.test(text)) score += 3;
  if (hour >= 10 && hour < 14 && place.kind === "restaurant") score += 3;
  if (hour >= 14 && hour < 17 && /(카페|디저트|쇼핑|해변|전망|공예)/.test(text)) score += 3;
  if (hour >= 17 && hour < 21 && /(이자카야|야키니쿠|스테이크|샤브샤브|선셋|일몰)/.test(text)) score += 4;
  if (hour >= 21 && /(라멘|이자카야|야간|국제거리)/.test(text)) score += 3;
  return score;
}

function surpriseCandidates() {
  const base = state.filtered.filter((place) => !state.visited.has(place.id));
  const candidates = base.length >= 3 ? base : state.places.filter((place) => place.status !== "제외" && place.tripRecommendation !== "제외추천");
  return candidates.map((place) => {
    let weight = timeAffinity(place);
    if (place.tripRecommendation === "강력추천") weight += 6;
    else if (place.tripRecommendation === "추천") weight += 3;
    if (state.favorites.has(place.id)) weight += 2;
    if (state.userLocation) weight += Math.max(0, 6 - Math.min(distanceTo(place), 60) / 10);
    return { place, weight: Math.max(weight, 0.3) };
  });
}

function weightedSample(items, count) {
  const pool = [...items];
  const picked = [];
  while (pool.length && picked.length < count) {
    const total = pool.reduce((sum, item) => sum + item.weight, 0);
    let target = Math.random() * total;
    let index = 0;
    for (; index < pool.length; index += 1) {
      target -= pool[index].weight;
      if (target <= 0) break;
    }
    const [item] = pool.splice(Math.min(index, pool.length - 1), 1);
    picked.push(item.place);
  }
  return picked;
}

function openSurprise() {
  const results = weightedSample(surpriseCandidates(), 3);
  els.surpriseResults.innerHTML = results.map((place) => `
    <article class="surprise-card" data-id="${e(place.id)}">
      <div class="surprise-card-emoji" aria-hidden="true">${e(place.emoji)}</div>
      <div>
        <h3>${e(place.name)}</h3>
        <p>${e(place.recommendationRole || place.summary || place.category)}</p>
      </div>
      <span class="surprise-distance">${e(formatDistance(place) || place.region)}</span>
    </article>
  `).join("");
  els.surpriseResults.querySelectorAll(".surprise-card").forEach((card) => {
    card.addEventListener("click", () => {
      closeSurprise();
      selectPlace(card.dataset.id, { fly: true, open: true });
    });
  });
  els.surpriseBackdrop.hidden = false;
  els.surpriseModal.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => els.surpriseModal.classList.add("is-open"));
}

function closeSurprise() {
  els.surpriseModal.classList.remove("is-open");
  els.surpriseModal.setAttribute("aria-hidden", "true");
  setTimeout(() => {
    els.surpriseBackdrop.hidden = true;
  }, 210);
}

function showToast(message) {
  window.clearTimeout(state.toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  state.toastTimer = window.setTimeout(() => els.toast.classList.remove("is-visible"), 2600);
}

function bindEvents() {
  els.kindFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-kind]");
    if (!button) return;
    state.kind = button.dataset.kind;
    if (state.kind !== "restaurant" && !["food", "cafe"].includes(state.quick)) {
      state.foodCategory = "all";
    }
    state.visibleCount = 28;
    render();
  });

  els.quickFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-quick]");
    if (!button) return;
    const next = button.dataset.quick;
    state.quick = next;
    if (!["food", "cafe"].includes(next) && state.kind !== "restaurant") {
      state.foodCategory = "all";
    }
    state.visibleCount = 28;
    if (next === "nearby" && !state.userLocation) requestLocation();
    render();
  });

  els.foodCategorySelect.addEventListener("change", () => {
    state.foodCategory = els.foodCategorySelect.value;
    state.visibleCount = 28;
    render();
  });

  els.regionFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-region]");
    if (!button) return;
    state.region = button.dataset.region;
    state.visibleCount = 28;
    render();
    fitFilteredPlaces();
  });

  els.searchInput.addEventListener("input", () => {
    state.search = els.searchInput.value.trim();
    els.clearSearchButton.hidden = !state.search;
    state.visibleCount = 28;
    render();
  });

  els.clearSearchButton.addEventListener("click", () => {
    els.searchInput.value = "";
    state.search = "";
    els.clearSearchButton.hidden = true;
    render();
    els.searchInput.focus();
  });

  els.sortSelect.addEventListener("change", () => {
    if (els.sortSelect.value === "distance" && !state.userLocation) requestLocation();
    state.sort = els.sortSelect.value;
    render();
  });

  els.refreshButton.addEventListener("click", () => loadPlaces({ force: true }).then(() => showToast("Google Sheet 최신 내용을 불러왔어요 ↻")));
  els.locateButton.addEventListener("click", () => requestLocation());
  els.fitButton.addEventListener("click", fitFilteredPlaces);
  els.surpriseButton.addEventListener("click", openSurprise);
  els.mobileSurpriseButton.addEventListener("click", openSurprise);
  els.rerollButton.addEventListener("click", openSurprise);

  document.querySelectorAll(".mobile-nav-button[data-view]").forEach((button) => {
    button.addEventListener("click", () => setAppView(button.dataset.view));
  });
  els.detailCloseButton.addEventListener("click", closeDetail);
  els.detailBackdrop.addEventListener("click", closeDetail);
  els.surpriseCloseButton.addEventListener("click", closeSurprise);
  els.surpriseBackdrop.addEventListener("click", closeSurprise);
  els.loadMoreButton.addEventListener("click", () => {
    state.visibleCount += 28;
    renderList();
  });


  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDetail();
      closeSurprise();
    }
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.installPrompt = event;
    els.installButton.hidden = false;
  });

  els.installButton.addEventListener("click", async () => {
    if (!state.installPrompt) return;
    state.installPrompt.prompt();
    await state.installPrompt.userChoice;
    state.installPrompt = null;
    els.installButton.hidden = true;
  });

  window.addEventListener("resize", () => {
    if (state.mobileView === "map") setTimeout(() => state.map?.invalidateSize(), 60);
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator && window.location.protocol === "https:") {
    navigator.serviceWorker.register("/service-worker.js").catch((error) => console.warn("SW registration failed", error));
  }
}

async function init() {
  initElements();
  initFromQuery();
  initMap();
  bindEvents();

  document.body.classList.toggle("view-map", state.mobileView === "map");
  document.body.classList.toggle("view-list", state.mobileView !== "map");
  document.querySelectorAll(".mobile-nav-button[data-view]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === state.mobileView);
  });

  registerServiceWorker();
  await loadPlaces();

  if (state.mobileView === "map") setTimeout(() => state.map?.invalidateSize(), 60);

  // Start with the whole island visible after markers are ready.
  if (!state.userLocation) fitFilteredPlaces();

  // Public sheet is the data source. Expose a small diagnostic hook for maintenance.
  window.okinawaNow = {
    refresh: () => loadPlaces({ force: true }),
    sheetUrl: SHEET_URL,
    state
  };
}

init().catch((error) => {
  console.error(error);
  setDataStatus("offline", "앱 초기화 오류");
  showToast("앱을 시작하지 못했어요. 새로고침해주세요.");
});
