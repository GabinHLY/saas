import test from "node:test";
import assert from "node:assert/strict";
import { metrics } from "./metrics.mjs";
test("profit, conversion and MRR use independent financial and latest snapshot data", () => {
  const p = metrics(
    { hours: 2 },
    [
      { amount: 9900, type: "ADVERTISING" },
      { amount: 100, type: "SPONSORSHIP" },
    ],
    [{ amount: 2000 }],
    [
      { date: "2026-10-02", visitors: 100, users: 20, customers: 5, mrr: 4900 },
      { date: "2026-10-01", visitors: 10, customers: 1, mrr: 900 },
    ],
  );
  assert.equal(p.revenue, 10000);
  assert.equal(p.profit, 8000);
  assert.equal(p.profitHour, 4000);
  assert.equal(p.mrr, 4900);
  assert.equal(p.conversion, 5);
  assert.equal(p.users, 20);
  assert.deepEqual(p.revenueSources, { ADVERTISING: 9900, SPONSORSHIP: 100 });
});
test("empty experience avoids divisions by zero", () => {
  const p = metrics({ hours: 0 });
  assert.equal(p.conversion, 0);
  assert.equal(p.profitHour, 0);
  assert.equal(p.revenue, 0);
});
