import { describe, it, expect, beforeAll } from "vitest";

import { MasterDataAirlinesApi } from "../../../sdk/index.js";
import { authConfig } from "../../../lib/api-config.js";

// US-1B-UI | spec: Master Data Airline (nguồn map Airline cho Sale Ticket).
// Vital API: POST /api/v1/master-data/airline/search → danh sách có "Vietnam Airlines".
describe("[VITAL] Master Data — Airline search", () => {
  let api: MasterDataAirlinesApi;

  beforeAll(async () => {
    api = new MasterDataAirlinesApi(await authConfig());
  }, 30_000);

  it('search trả về danh sách có "Vietnam Airlines"', async () => {
    const res = await api.searchAirlines({ search: "Vietnam Airlines" });
    const names = (res.data ?? []).map((a) => a.name);
    expect(names).toContain("Vietnam Airlines");
  }, 30_000);
});
