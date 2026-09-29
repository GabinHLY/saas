import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
test("admin lifecycle, auth, public totals, metric validation and cascade deletion", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ww-test-"));
  const password = randomBytes(24).toString("hex");
  const port = 18341;
  const child = spawn(process.execPath, ["server/index.mjs"], {
    env: {
      ...process.env,
      PORT: String(port),
      DATABASE_PATH: join(dir, "test.sqlite"),
      ADMIN_PASSWORD: password,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    await new Promise((resolve, reject) => {
      child.stdout.once("data", resolve);
      child.once("error", reject);
      child.once("exit", () => reject(Error("API failed to start")));
    });
    let cookie = "";
    async function request(path, method = "GET", body) {
      return fetch(`http://localhost:${port}/api${path}`, {
        method,
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: body ? JSON.stringify(body) : undefined,
      });
    }
    assert.equal((await request("/admin/projects")).status, 401);
    assert.equal(
      (await request("/login", "POST", { password: "incorrect" })).status,
      401,
    );
    const login = await request("/login", "POST", { password });
    assert.equal(login.status, 200);
    cookie = login.headers.get("set-cookie").split(";")[0];
    const project = {
      day: 1,
      name: "Test",
      slug: "test",
      status: "SHIPPED",
      product_type: "GAME",
      model: "ADVERTISING",
      hours: 2,
    };
    assert.equal(
      (
        await request("/admin/projects", "POST", {
          ...project,
          day: 2,
          slug: "bad-type",
          product_type: "SPACESHIP",
        })
      ).status,
      400,
    );
    assert.equal(
      (await request("/admin/projects", "POST", project)).status,
      200,
    );
    assert.equal(
      (await request("/admin/projects", "POST", project)).status,
      400,
    );
    const [p] = await (await request("/admin/projects")).json();
    assert.equal(
      (
        await request(`/admin/projects/${p.id}/revenue`, "POST", {
          amount: 1299,
          type: "SUBSCRIPTION",
          date: "2026-10-01",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/admin/projects/${p.id}/revenue`, "POST", {
          amount: 500,
          type: "SPONSORSHIP",
          date: "2026-10-02",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/admin/projects/${p.id}/expense`, "POST", {
          amount: 199,
          category: "API",
          date: "2026-10-01",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/admin/projects/${p.id}/snapshot`, "POST", {
          date: "2026-10-01",
          visitors: 100,
          users: 10,
          active: 8,
          customers: 2,
          mrr: 900,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/admin/projects/${p.id}/revenue`, "POST", {
          amount: -1,
          date: "2026-10-01",
        })
      ).status,
      400,
    );
    const [privateP] = await (await request("/admin/projects")).json();
    assert.equal(privateP.profit, 1600);
    assert.equal(privateP.mrr, 900);
    assert.equal(privateP.product_type, "GAME");
    assert.deepEqual(privateP.revenueSources, {
      SUBSCRIPTION: 1299,
      SPONSORSHIP: 500,
    });
    const publicP = await (await request("/projects/test")).json();
    assert.equal(publicP.revenue, 1799);
    // Totaux publics, détail des dépenses privé.
    assert.equal(publicP.costs, 199);
    assert.equal(publicP.profit, 1600);
    assert.equal(publicP.expenses, undefined);
    const og = await request("/og/test");
    assert.equal(og.headers.get("content-type"), "image/png");
    assert.deepEqual(
      [...new Uint8Array(await og.arrayBuffer()).slice(0, 4)],
      [137, 80, 78, 71],
    );
    const summary = await (await request("/admin/revenue-summary")).json();
    assert.equal(summary[0].amount, 1299);
    const page = await fetch(`http://localhost:${port}/exp/test`);
    assert.match(await page.text(), /property="og:title"/);
    assert.equal(
      (await request("/admin/uploads", "POST", { data: "not-an-image" }))
        .status,
      400,
    );

    assert.equal(
      (
        await request(`/admin/projects/${p.id}`, "PUT", {
          ...project,
          name: "Updated",
        })
      ).status,
      200,
    );
    assert.equal(
      (await request(`/admin/projects/${p.id}`, "DELETE")).status,
      200,
    );
    assert.deepEqual(await (await request("/projects")).json(), []);
    await request("/logout", "POST");
    assert.equal((await request("/admin/projects")).status, 401);
  } finally {
    child.kill();
    await new Promise((r) => child.once("exit", r));
    await rm(dir, { recursive: true, force: true });
  }
});
