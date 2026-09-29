import http from "node:http";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, extname } from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import sharp from "sharp";
import { ogImage, escapeHtml } from "./share.mjs";
import { metrics } from "./metrics.mjs";
mkdirSync("data", { recursive: true });
const db = new DatabaseSync(
  process.env.DATABASE_PATH || "data/challenge.sqlite",
);
db.exec(
  `PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,email TEXT UNIQUE,password TEXT); CREATE TABLE IF NOT EXISTS saas(id INTEGER PRIMARY KEY,day INTEGER UNIQUE NOT NULL,slug TEXT UNIQUE NOT NULL,name TEXT NOT NULL,pitch TEXT DEFAULT '',description TEXT DEFAULT '',hypothesis TEXT DEFAULT '',result TEXT DEFAULT '',decision TEXT DEFAULT 'OBSERVE',status TEXT DEFAULT 'PLANNED',category TEXT DEFAULT 'PRODUCTIVITY',model TEXT DEFAULT 'SUBSCRIPTION',hours REAL DEFAULT 0,url TEXT DEFAULT '',image TEXT DEFAULT '',stack TEXT DEFAULT '',launch TEXT DEFAULT '',demo INTEGER DEFAULT 0); CREATE TABLE IF NOT EXISTS revenue_transactions(id INTEGER PRIMARY KEY,saas_id INTEGER REFERENCES saas(id) ON DELETE CASCADE,amount INTEGER NOT NULL,type TEXT,date TEXT,description TEXT); CREATE TABLE IF NOT EXISTS expenses(id INTEGER PRIMARY KEY,saas_id INTEGER REFERENCES saas(id) ON DELETE CASCADE,amount INTEGER NOT NULL,category TEXT,date TEXT,description TEXT); CREATE TABLE IF NOT EXISTS analytics_snapshots(id INTEGER PRIMARY KEY,saas_id INTEGER REFERENCES saas(id) ON DELETE CASCADE,date TEXT,visitors INTEGER,users INTEGER,active INTEGER,customers INTEGER,mrr INTEGER,UNIQUE(saas_id,date)); CREATE TABLE IF NOT EXISTS build_logs(id INTEGER PRIMARY KEY,saas_id INTEGER REFERENCES saas(id) ON DELETE CASCADE,date TEXT,title TEXT,description TEXT);`,
);
if (
  !db
    .prepare("PRAGMA table_info(saas)")
    .all()
    .some((c) => c.name === "logo")
)
  db.exec("ALTER TABLE saas ADD COLUMN logo TEXT DEFAULT ''");
const hash = (p) => {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(p, salt, 64).toString("hex");
};
if (process.env.ADMIN_PASSWORD) {
  if (process.env.ADMIN_PASSWORD.length < 12)
    throw Error(
      `ADMIN_PASSWORD: minimum 12 caractères (reçu : ${process.env.ADMIN_PASSWORD.length})`,
    );
  db.prepare(
    "INSERT INTO users(email,password) VALUES (?,?) ON CONFLICT(email) DO UPDATE SET password=excluded.password",
  ).run("admin", hash(process.env.ADMIN_PASSWORD));
}
const sessions = new Map(),
  attempts = new Map();
const list = () =>
  db
    .prepare("SELECT * FROM saas ORDER BY day")
    .all()
    .map((p) =>
      metrics(
        p,
        ...["revenue_transactions", "expenses", "analytics_snapshots"].map(
          (t) => db.prepare(`SELECT * FROM ${t} WHERE saas_id=?`).all(p.id),
        ),
      ),
    );
const publicProject = (p) => {
  const { costs, profit, profitHour, ...rest } = p;
  return rest;
};
const json = (res, status, data) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
};
const projectFields = [
  "day",
  "slug",
  "name",
  "pitch",
  "description",
  "hypothesis",
  "result",
  "decision",
  "status",
  "category",
  "model",
  "hours",
  "url",
  "image",
  "logo",
  "stack",
  "launch",
];
const tables = {
  revenue: {
    table: "revenue_transactions",
    fields: ["amount", "type", "date", "description"],
  },
  expense: {
    table: "expenses",
    fields: ["amount", "category", "date", "description"],
  },
  snapshot: {
    table: "analytics_snapshots",
    fields: ["date", "visitors", "users", "active", "customers", "mrr"],
  },
  log: { table: "build_logs", fields: ["date", "title", "description"] },
};
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost"),
        path = url.pathname;
      const sid = req.headers.cookie?.match(/(?:^|; )session=([^;]+)/)?.[1];
      const authenticated = (sessions.get(sid) || 0) > Date.now();
      if (
        req.method !== "GET" &&
        req.headers.origin &&
        req.headers.origin !== `http://${req.headers.host}` &&
        req.headers.origin !== `https://${req.headers.host}`
      )
        return json(res, 403, { error: "Origine refusée" });
      let body = {};
      if (["POST", "PUT", "DELETE"].includes(req.method)) {
        let raw = "";
        for await (const chunk of req) {
          raw += chunk;
          if (raw.length > 8000000) throw Error("Requête trop volumineuse");
        }
        body = raw ? JSON.parse(raw) : {};
      }
      if (path === "/api/session")
        return json(res, 200, {
          authenticated,
          configured: !!db.prepare("SELECT id FROM users LIMIT 1").get(),
        });
      if (path === "/api/login" && req.method === "POST") {
        const ip = req.socket.remoteAddress;
        const a = attempts.get(ip) || { count: 0, until: Date.now() + 600000 };
        if (a.until < Date.now()) {
          a.count = 0;
          a.until = Date.now() + 600000;
        }
        attempts.set(ip, a);
        if (++a.count > 10)
          return json(res, 429, {
            error: "Trop de tentatives. Réessayez dans 10 minutes.",
          });
        const u = db.prepare("SELECT * FROM users WHERE email=?").get("admin");
        const [salt, stored] = u?.password?.split(":") || [];
        if (
          !u ||
          typeof body.password !== "string" ||
          !timingSafeEqual(
            scryptSync(body.password, salt, 64),
            Buffer.from(stored, "hex"),
          )
        )
          return json(res, 401, { error: "Mot de passe incorrect" });
        const token = randomBytes(32).toString("hex");
        sessions.set(token, Date.now() + 86400000);
        res.setHeader(
          "Set-Cookie",
          `session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
        );
        return json(res, 200, { ok: true });
      }
      if (path === "/api/logout" && req.method === "POST") {
        sessions.delete(sid);
        res.setHeader(
          "Set-Cookie",
          "session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
        );
        return json(res, 200, { ok: true });
      }
      if (path.startsWith("/api/admin") && !authenticated)
        return json(res, 401, { error: "Authentification requise" });
      if (path === "/api/admin/revenue-summary" && req.method === "GET")
        return json(
          res,
          200,
          db
            .prepare(
              "SELECT type,SUM(amount) AS amount FROM revenue_transactions GROUP BY type ORDER BY amount DESC",
            )
            .all(),
        );
      if (path === "/api/admin/uploads" && req.method === "POST") {
        if (
          typeof body.data !== "string" ||
          !/^data:image\/(png|jpeg|webp);base64,/.test(body.data)
        )
          throw Error("Image PNG, JPEG ou WebP requise");
        const buffer = Buffer.from(body.data.split(",")[1], "base64");
        if (buffer.length > 5000000) throw Error("Image limitée à 5 Mo");
        const output = await sharp(buffer, { limitInputPixels: 25000000 })
          .rotate()
          .resize({ width: 1600, withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();
        mkdirSync("data/uploads", { recursive: true });
        const name = randomBytes(16).toString("hex") + ".webp";
        writeFileSync("data/uploads/" + name, output);
        return json(res, 200, { url: "/uploads/" + name });
      }
      if (/^\/uploads\/[a-f0-9]+\.webp$/.test(path) && req.method === "GET") {
        const file = resolve("data", "." + path);
        if (!existsSync(file))
          return json(res, 404, { error: "Image introuvable" });
        res.setHeader("Content-Type", "image/webp");
        return res.end(readFileSync(file));
      }
      if (path.startsWith("/api/og/") && req.method === "GET") {
        const p = list().find((p) => p.slug === path.split("/").pop());
        if (!p) return json(res, 404, { error: "Expérience introuvable" });
        res.setHeader("Content-Type", "image/png");
        return res.end(await ogImage(p));
      }
      if (path === "/api/projects" && req.method === "GET")
        return json(res, 200, list().map(publicProject));
      if (path === "/api/admin/projects" && req.method === "GET")
        return json(res, 200, list());
      if (path.startsWith("/api/projects/") && req.method === "GET") {
        const p = list().find(
          (p) => p.slug === decodeURIComponent(path.split("/").pop()),
        );
        if (!p) return json(res, 404, { error: "Expérience introuvable" });
        return json(res, 200, {
          ...publicProject(p),
          revenues: db
            .prepare(
              "SELECT * FROM revenue_transactions WHERE saas_id=? ORDER BY date",
            )
            .all(p.id),
          snapshots: db
            .prepare(
              "SELECT * FROM analytics_snapshots WHERE saas_id=? ORDER BY date",
            )
            .all(p.id),
          logs: db
            .prepare("SELECT * FROM build_logs WHERE saas_id=? ORDER BY date")
            .all(p.id),
        });
      }
      if (
        (path === "/api/admin/projects" && req.method === "POST") ||
        (/^\/api\/admin\/projects\/\d+$/.test(path) && req.method === "PUT")
      ) {
        if (
          !Number.isInteger(+body.day) ||
          body.day < 1 ||
          body.day > 31 ||
          !body.name?.trim() ||
          !body.slug?.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        )
          throw Error("Jour (1–31), nom et slug valide requis");
        if (
          ![
            "PLANNED",
            "BUILDING",
            "SHIPPED",
            "PROMISING",
            "FAILED",
            "PROFITABLE",
            "PAUSED",
          ].includes(body.status)
        )
          throw Error("Statut invalide");
        for (const f of ["url", "image", "logo"])
          if (
            body[f] &&
            !/^https?:\/\//.test(body[f]) &&
            !(f !== "url" && /^\/uploads\/[a-f0-9]+\.webp$/.test(body[f]))
          )
            throw Error("URL HTTP(S) requise");
        if (!Number.isFinite(+body.hours) || +body.hours < 0)
          throw Error("Durée invalide");
        const values = projectFields.map((f) => body[f] ?? "");
        if (req.method === "POST")
          db.prepare(
            `INSERT INTO saas(${projectFields.join(",")}) VALUES (${projectFields.map(() => "?")})`,
          ).run(...values);
        else
          db.prepare(
            `UPDATE saas SET ${projectFields.map((f) => f + "=?")} WHERE id=?`,
          ).run(...values, +path.split("/").pop());
        return json(res, 200, { ok: true });
      }
      if (
        /^\/api\/admin\/projects\/\d+$/.test(path) &&
        req.method === "DELETE"
      ) {
        db.prepare("DELETE FROM saas WHERE id=?").run(+path.split("/").pop());
        return json(res, 200, { ok: true });
      }
      const match = path.match(
        /^\/api\/admin\/projects\/(\d+)\/(revenue|expense|snapshot|log)$/,
      );
      if (match && req.method === "POST") {
        const spec = tables[match[2]];
        if (!body.date || Number.isNaN(Date.parse(body.date)))
          throw Error("Date valide requise");
        for (const key of [
          "amount",
          "visitors",
          "users",
          "active",
          "customers",
          "mrr",
        ])
          if (
            spec.fields.includes(key) &&
            (!Number.isSafeInteger(body[key]) || body[key] < 0)
          )
            throw Error(
              "Les métriques doivent être des entiers positifs (montants en centimes)",
            );
        if (match[2] === "log" && !body.title?.trim())
          throw Error("Titre requis");
        const fields = ["saas_id", ...spec.fields];
        const conflict =
          match[2] === "snapshot"
            ? " ON CONFLICT(saas_id,date) DO UPDATE SET " +
              spec.fields
                .filter((f) => f !== "date")
                .map((f) => f + "=excluded." + f)
                .join(",")
            : "";
        db.prepare(
          `INSERT INTO ${spec.table}(${fields}) VALUES (${fields.map(() => "?")})${conflict}`,
        ).run(+match[1], ...spec.fields.map((f) => body[f] ?? ""));
        return json(res, 200, { ok: true });
      }
      if (path.startsWith("/api/"))
        return json(res, 404, { error: "Route introuvable" });
      const root = resolve("dist");
      const file = resolve(root, "." + path);
      if (!file.startsWith(root + "/") && file !== root)
        return json(res, 403, { error: "Accès refusé" });
      const target =
        existsSync(file) && extname(file) ? file : root + "/index.html";
      if (!existsSync(target))
        return json(res, 404, { error: "Lancez npm run dev ou npm run build" });
      res.setHeader(
        "Content-Type",
        {
          ".html": "text/html",
          ".js": "text/javascript",
          ".css": "text/css",
          ".svg": "image/svg+xml",
          ".png": "image/png",
        }[extname(target)] || "application/octet-stream",
      );
      if (extname(target) === ".html") {
        let html = readFileSync(target, "utf8");
        const p = list().find((p) => path === "/saas/" + p.slug);
        if (p) {
          const base = process.env.PUBLIC_URL || `http://${req.headers.host}`;
          const title = escapeHtml(
            `${p.name} — jour ${p.day} sur 31 · What works?`,
          );
          html = html
            .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
            .replace(
              "</head>",
              `<meta property="og:title" content="${title}"/><meta property="og:description" content="${escapeHtml(p.pitch)}"/><meta property="og:type" content="website"/><meta property="og:url" content="${escapeHtml(base + path)}"/><meta property="og:image" content="${escapeHtml(base + "/api/og/" + p.slug)}"/><meta name="twitter:card" content="summary_large_image"/></head>`,
            );
        }
        res.end(html);
      } else res.end(readFileSync(target));
    } catch (e) {
      json(res, 400, {
        error: e.message.includes("UNIQUE")
          ? "Ce jour ou ce slug est déjà utilisé."
          : e.message,
      });
    }
  })
  .listen(Number(process.env.PORT) || 3001, "0.0.0.0", function () {
    console.log(`API prête sur le port ${this.address().port}`);
  });
