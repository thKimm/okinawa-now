import { createHash } from "node:crypto";

const FOOD_EMOJI = {
  "오키나와 소바": "🍜",
  "라멘·면": "🍜",
  "스테이크·철판": "🥩",
  "야키니쿠": "🥩",
  "해산물·스시": "🍣",
  "이자카야": "🍻",
  "버거·타코·간편식": "🌮",
  "카페·디저트": "☕",
  "브런치·베이커리": "🥐",
  "일식·가정식": "🍱",
  "돈카츠": "🐷",
  "이탈리안": "🍕",
  "중식·마라": "🥟",
  "야키토리·닭": "🍗",
  "시장·푸드센터": "🦐",
  "샤브샤브": "🍲",
  "다이닝바": "🍹"
};

const SPOT_EMOJI = {
  "섬·드라이브": "🌴",
  "드라이브": "🚗",
  "도시·쇼핑": "🛍️",
  "해변·산책": "🏖️",
  "해변·일몰": "🏖️",
  "해변·스노클링": "🤿",
  "전망대·자연": "🌅",
  "복합관광·쇼핑": "🛍️",
  "수족관": "🐠",
  "야시장·이자카야": "🍢",
  "야간·유흥": "🌃",
  "시장·이자카야": "🍺",
  "해양 액티비티": "🤿",
  "쇼핑": "🛍️",
  "거리·공예": "🏺",
  "거리·자연": "🌿",
  "역사·유적": "🏯",
  "거리·역사": "🚶",
  "드라이브·전망": "🚗",
  "공예·체험": "🫧",
  "역사·성지": "⛩️",
  "리조트·휴양": "🏝️",
  "휴게소·쇼핑": "🍙"
};

const SHOP_EMOJI = {
  "드럭스토어·잡화": "🧴",
  "기념품·과자": "🎁",
  "백화점": "🛍️",
  "쇼핑몰": "🛒",
  "면세·명품": "💎",
  "대형 쇼핑몰": "🛍️",
  "관광형 쇼핑": "🎪",
  "공예·로컬 쇼핑": "🏺",
  "마지막 기념품 쇼핑": "✈️"
};

function clean(value) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function numberOr(value, fallback = 3) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function idFor(kind, name, _address) {
  const hash = createHash("sha1")
    .update(`${kind}|${name}`, "utf8")
    .digest("hex")
    .slice(0, 12);
  return `${kind}-${hash}`;
}

export function normalizeRestaurants(records) {
  return records
    .map((record) => {
      const name = clean(record["표준 이름"]);
      const category = clean(record["음식 대분류"]);
      const address = clean(record["주소"]);
      return {
        id: idFor("restaurant", name, address),
        kind: "restaurant",
        name,
        nativeName: clean(record["일본어/영문명"]),
        emoji: FOOD_EMOJI[category] ?? "📍",
        category,
        region: clean(record["권역"]),
        area: clean(record["세부 지역"]),
        address,
        mapUrl: clean(record["Google Maps"]),
        summary: clean(record["대표 메뉴·추천"]),
        hours: clean(record["영업·휴무 메모"]),
        reservation: clean(record["예약"]),
        parking: clean(record["주차"]),
        note: clean(record["한줄 메모"]),
        verification: clean(record["검증 상태"]),
        source: clean(record["출처"]),
        tripRecommendation: clean(record["이번 여행 추천"]),
        recommendedDay: clean(record["추천 일차"]),
        recommendationRole: clean(record["추천 역할"]),
        status: clean(record["방문 상태"]),
        priority: numberOr(record["우선순위"])
      };
    })
    .filter((place) => place.name);
}

export function normalizeSpots(records) {
  return records
    .map((record) => {
      const name = clean(record["장소"]);
      const category = clean(record["유형"]);
      const address = clean(record["주소·집결지"]);
      return {
        id: idFor("spot", name, address),
        kind: "spot",
        name,
        nativeName: "",
        emoji: SPOT_EMOJI[category] ?? "📍",
        category,
        region: clean(record["권역"]),
        area: "",
        address,
        mapUrl: clean(record["Google Maps"]),
        summary: clean(record["핵심 활동"]),
        hours: clean(record["추천 시간대"]),
        reservation: clean(record["예약·비용"]),
        parking: clean(record["교통·주차"]),
        note: clean(record["주의사항"]),
        verification: clean(record["검증 상태"]),
        source: clean(record["출처"]),
        tripRecommendation: clean(record["이번 여행 추천"]),
        recommendedDay: clean(record["추천 일차"]),
        recommendationRole: clean(record["추천 역할"]),
        status: clean(record["방문 상태"]),
        priority: numberOr(record["우선순위"]),
        duration: clean(record["권장 소요"])
      };
    })
    .filter((place) => place.name);
}

export function normalizeShoppingSpots(records) {
  return records
    .map((record) => {
      const name = clean(record["쇼핑 스팟"]);
      const category = clean(record["유형"]);
      const address = clean(record["주소"]);
      const priority = numberOr(record["우선순위"]);
      return {
        id: idFor("shop", name, address),
        kind: "shop",
        name,
        nativeName: "",
        emoji: SHOP_EMOJI[category] ?? "🛍️",
        category,
        region: clean(record["권역"]),
        area: "",
        address,
        mapUrl: clean(record["Google Maps"]),
        summary: clean(record["주로 살 것"]),
        hours: clean(record["영업·이용 메모"]),
        reservation: "",
        parking: clean(record["주차·접근"]),
        note: "",
        verification: "확인 완료",
        source: clean(record["출처"]),
        tripRecommendation: priority <= 2 ? "추천" : "예비",
        recommendedDay: clean(record["추천 일차"]),
        recommendationRole: "",
        status: "미정",
        priority
      };
    })
    .filter((place) => place.name);
}
