import test from "node:test";
import assert from "node:assert/strict";
import { parseCsv, rowsToObjects } from "../lib/csv.js";
import { normalizeRestaurants, normalizeShoppingSpots, normalizeSpots } from "../lib/normalize.js";

test("CSV parser handles commas, quotes and embedded newlines", () => {
  const rows = parseCsv('Name,Note\n"A, B","line 1\nline 2"\n"C","say ""hi"""');
  assert.deepEqual(rows, [
    ["Name", "Note"],
    ["A, B", "line 1\nline 2"],
    ["C", 'say "hi"']
  ]);
  assert.deepEqual(rowsToObjects(rows)[0], { Name: "A, B", Note: "line 1\nline 2" });
});

test("restaurant rows normalize into app place model", () => {
  const [place] = normalizeRestaurants([
    {
      "방문 상태": "가고싶음",
      "우선순위": "1",
      "표준 이름": "나카무라 소바",
      "일본어/영문명": "なかむらそば",
      "음식 대분류": "오키나와 소바",
      "대표 메뉴·추천": "소키 소바",
      "권역": "중부",
      "세부 지역": "온나",
      "주소": "Onna, Okinawa",
      "Google Maps": "https://maps.google.com/",
      "이번 여행 추천": "강력추천"
    }
  ]);
  assert.equal(place.kind, "restaurant");
  assert.equal(place.emoji, "🍜");
  assert.equal(place.priority, 1);
  assert.match(place.id, /^restaurant-/);
});

test("spot and shopping rows get distinct kinds", () => {
  const [spot] = normalizeSpots([{ 장소: "푸른 동굴", 유형: "해양 액티비티", 주소·집결지: "Onna" }]);
  const [shop] = normalizeShoppingSpots([{ 우선순위: "1", "쇼핑 스팟": "돈키호테", 유형: "드럭스토어·잡화", 주소: "Naha" }]);
  assert.equal(spot.kind, "spot");
  assert.equal(spot.emoji, "🤿");
  assert.equal(shop.kind, "shop");
  assert.equal(shop.emoji, "🧴");
});

test("places API merges all three Google Sheet tabs", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const text = String(url);
    if (text.includes("gid=578914801")) {
      return new Response('방문 상태,우선순위,표준 이름,일본어/영문명,음식 대분류,대표 메뉴·추천,권역,세부 지역,주소,Google Maps\n미정,1,테스트 소바,テストそば,오키나와 소바,소바,중부,온나,Onna Okinawa,https://maps.google.com');
    }
    if (text.includes("gid=485003184")) {
      return new Response('방문 상태,우선순위,장소,권역,유형,핵심 활동,주소·집결지\n미정,1,테스트 비치,중부,해변·산책,산책,Chatan Okinawa');
    }
    if (text.includes("gid=303701298")) {
      return new Response('우선순위,쇼핑 스팟,권역,유형,주로 살 것,주소\n1,테스트 숍,남부,기념품·과자,과자,Naha Okinawa');
    }
    throw new Error(`unexpected URL: ${text}`);
  };

  try {
    const module = await import(`../api/places.js?test=${Date.now()}`);
    const response = await module.default.fetch(new Request("https://example.test/api/places"));
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.counts.all, 3);
    assert.deepEqual(payload.places.map((place) => place.kind).sort(), ["restaurant", "shop", "spot"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
