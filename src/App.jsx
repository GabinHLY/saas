import React, { useState, useEffect, useRef } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Sun,
  Moon,
  Menu,
} from "lucide-react";
import { demoProjects } from "./demo";
import { LangContext, makeI18n, useI18n } from "./i18n";
import { PRODUCT_TYPES, BUSINESS_MODELS } from "../shared/catalog.mjs";
import "./style.css";
const dd = (n) => String(n).padStart(2, "0");
const shipped = (p) => !["PLANNED", "BUILDING"].includes(p.status);
async function api(path, method = "GET", body) {
  const r = await fetch("/api" + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.error || "Une erreur est survenue");
  return data;
}
function stored(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function store(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}
export default function App() {
  const [path, setPath] = useState(location.pathname),
    [projects, setProjects] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [demo, setDemo] = useState(
      new URLSearchParams(location.search).get("demo") === "1",
    ),
    [dark, setDark] = useState(() =>
      stored("ww-theme")
        ? stored("ww-theme") === "dark"
        : matchMedia("(prefers-color-scheme: dark)").matches,
    ),
    [lang, setLang] = useState(() =>
      stored("ww-lang") === "en" ? "en" : "fr",
    );
  const [filter, setFilter] = useState("ALL"),
    [view, setView] = useState("GRID"),
    [metric, setMetric] = useState("revenue"),
    [session, setSession] = useState(null),
    [editing, setEditing] = useState(null),
    [entry, setEntry] = useState(null),
    [toast, setToast] = useState(""),
    [menu, setMenu] = useState(false);
  const { t, money, num, dec, loc } = makeI18n(lang);
  const admin = path.startsWith("/admin");
  function navigate(to) {
    history.pushState(
      {},
      "",
      to + (demo && !to.startsWith("/admin") ? "?demo=1" : ""),
    );
    setPath(to);
    setMenu(false);
    window.scrollTo(0, 0);
  }
  useEffect(() => {
    const f = () => {
      setPath(location.pathname);
      setDemo(new URLSearchParams(location.search).get("demo") === "1");
    };
    addEventListener("popstate", f);
    return () => removeEventListener("popstate", f);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    store("ww-theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.documentTitle;
    store("ww-lang", lang);
  }, [lang]);
  async function refresh() {
    setError("");
    try {
      const s = await api("/session");
      setSession(s);
      setProjects(
        await api(admin && s.authenticated ? "/admin/projects" : "/projects"),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, [admin]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const data = demo && !admin ? demoProjects[lang] : projects;
  const total = (k) => data.reduce((s, p) => s + (p[k] || 0), 0),
    count = data.filter(shipped).length;
  const day = demo
    ? 14
    : Math.max(
        0,
        Math.min(
          31,
          Math.floor(
            (Date.now() - new Date("2026-10-01T00:00:00+02:00")) / 86400000,
          ) + 1,
        ),
      );
  const active = data.find((p) => p.status === "BUILDING");
  const link = (to, label, cls = "") => (
    <a
      className={cls}
      href={to}
      onClick={(e) => {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          navigate(to);
        }
      }}
    >
      {label}
    </a>
  );
  async function saved() {
    setEditing(null);
    setEntry(null);
    await refresh();
    setToast(t.saved);
  }
  const filtered = data.filter(
    (p) =>
      filter === "ALL" ||
      (filter === "SHIPPED" && shipped(p)) ||
      p.status === filter,
  );
  return (
    <LangContext.Provider value={lang}>
      <header className="masthead">
        <div className="masthead-inner">
          {link(
            "/",
            <>
              {t.brand}
              <span className="brand-q">?</span>
            </>,
            "brand",
          )}
          <nav className={menu ? "open" : ""}>
            {link(
              "/",
              <>
                {t.nav.experiments}
                {data.length > 0 && <sup>{data.length}</sup>}
              </>,
              path === "/" ? "selected" : "",
            )}
            {link(
              "/leaderboard",
              t.nav.leaderboard,
              path === "/leaderboard" ? "selected" : "",
            )}
            {link(
              "/journal",
              t.nav.journal,
              path === "/journal" ? "selected" : "",
            )}
          </nav>
          <div className="masthead-tools">
            <div className="lang-switch" role="group" aria-label={t.language}>
              {[
                ["fr", "Français"],
                ["en", "English"],
              ].map(([code, name]) => (
                <button
                  key={code}
                  lang={code}
                  className={lang === code ? "active" : ""}
                  aria-pressed={lang === code}
                  aria-label={name}
                  onClick={() => setLang(code)}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              className="icon-button"
              aria-label={dark ? t.themeLight : t.themeDark}
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="mobile-menu icon-button"
              aria-label={t.openNav}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>
      <main>
        {error && (
          <div className="alert">
            {error} <button onClick={refresh}>{t.retry}</button>
          </div>
        )}
        {admin ? (
          <>
            <div className="section-intro">
              <p className="kicker">{t.admin.kicker}</p>
              <h1>
                {t.admin.title[0]} <em>{t.admin.title[1]}</em>
              </h1>
            </div>
            {session?.authenticated ? (
              <>
                <div className="admin-toolbar">
                  <p>{t.admin.note}</p>
                  <button
                    className="button"
                    onClick={() =>
                      setEditing({
                        day:
                          Array.from({ length: 31 }, (_, i) => i + 1).find(
                            (d) => !projects.some((p) => p.day === d),
                          ) || 31,
                        status: "PLANNED",
                        product_type:
                          PRODUCT_TYPES.find(
                            (x) => !projects.some((p) => p.product_type === x),
                          ) || "OTHER",
                        model:
                          BUSINESS_MODELS.find(
                            (x) => !projects.some((p) => p.model === x),
                          ) || "OTHER",
                        category: "",
                        hours: 0,
                        decision: "OBSERVE",
                      })
                    }
                  >
                    <Plus size={16} /> {t.admin.newExperiment}
                  </button>
                  <button
                    className="text-button"
                    onClick={async () => {
                      await api("/logout", "POST");
                      refresh();
                    }}
                  >
                    {t.admin.logout}
                  </button>
                </div>
                <Stats
                  items={[
                    [count + "/31", t.admin.shipped],
                    [money(total("revenue")), t.stats.revenue],
                    [money(total("costs")), t.stats.costs],
                    [money(total("profit")), t.stats.profit, true],
                    [
                      money(
                        total("hours") ? total("profit") / total("hours") : 0,
                      ),
                      t.stats.perHour,
                    ],
                    [money(total("mrr")), t.stats.mrr],
                    [num(total("visitors")), t.stats.visitors],
                    [num(total("users")), t.stats.users],
                    [num(total("customers")), t.stats.customers],
                    [dec(total("hours")), t.stats.buildTime],
                  ]}
                />
                <Leaderboard
                  data={data}
                  metric={metric}
                  setMetric={setMetric}
                  link={link}
                  privateView
                  onEdit={setEditing}
                  onEntry={setEntry}
                />
                <Insights data={data} />
              </>
            ) : (
              <Login session={session} onLogin={refresh} />
            )}
          </>
        ) : path.startsWith("/exp/") || path.startsWith("/saas/") ? (
          <Experiment
            slug={path.split("/").pop()}
            demo={demo}
            data={data}
            link={link}
          />
        ) : path === "/leaderboard" ? (
          <>
            <div className="section-intro">
              <p className="kicker">{t.board.kicker}</p>
              <h1>
                {t.board.title[0]} <em>{t.board.title[1]}</em>
              </h1>
              <p className="intro-text">{t.board.intro}</p>
            </div>
            {demo && <DemoNotice />}
            <Leaderboard
              data={data.filter(shipped)}
              metric={metric}
              setMetric={setMetric}
              link={link}
            />
            <Insights data={data.filter(shipped)} />
          </>
        ) : path === "/journal" ? (
          <Journal data={data} demo={demo} link={link} />
        ) : (
          <>
            <section className="hero">
              <p className="kicker">{t.hero.kicker}</p>
              <h1>
                {t.hero.title[0]}
                <span className="hl">{t.hero.title[1]}</span>
                {t.hero.title[2]}
              </h1>
              <div className="hero-lede">
                <p>{t.hero.lede}</p>
                <p className="hero-loop">
                  {t.hero.loop.map((step, i) => (
                    <React.Fragment key={step}>
                      {i > 0 && <span aria-hidden="true"> → </span>}
                      <span className={i === 2 ? "hl" : ""}>{step}</span>
                    </React.Fragment>
                  ))}
                </p>
                <a className="text-button" href="#registre">
                  {t.hero.openRegister} <ArrowRight size={16} />
                </a>
              </div>
              <div className="hero-count">
                <div className="count-head">
                  <span className="count-label">{t.hero.dayLabel(day)}</span>
                  <span className="count-num">{day}</span>
                  <span className="count-of">{t.hero.of31}</span>
                </div>
                <Tally day={day} />
                <p className="count-date">
                  {(demo
                    ? new Date("2026-10-14T12:00")
                    : new Date()
                  ).toLocaleDateString(loc, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <div className="workbench">
                  <span>{t.hero.workbench}</span>
                  {active ? (
                    link(
                      "/exp/" + active.slug,
                      <>
                        {active.name} <ArrowUpRight size={16} />
                      </>,
                    )
                  ) : (
                    <strong>{t.hero.firstBuild}</strong>
                  )}
                </div>
              </div>
            </section>
            {demo && <DemoNotice />}
            <Stats
              items={[
                [dd(count) + "/31", t.stats.experimentsShipped],
                [num(total("visitors")), t.stats.visitors],
                [num(total("users")), t.stats.users],
                [num(total("customers")), t.stats.payingCustomers],
                [money(total("revenue")), t.stats.totalRevenue, true],
                [money(total("profit")), t.stats.profit],
              ]}
            />
            <Month
              data={data}
              day={day}
              onPick={(d, p) =>
                p ? navigate("/exp/" + p.slug) : setToast(t.blankDay(d))
              }
            />
            <section id="registre" className="register">
              <div className="section-heading">
                <div>
                  <h2>{t.register.title}</h2>
                  <p>{t.register.sub}</p>
                </div>
                <div
                  className="view-switch"
                  role="group"
                  aria-label={t.register.display}
                >
                  <button
                    className={view === "GRID" ? "active" : ""}
                    onClick={() => setView("GRID")}
                  >
                    {t.register.cards}
                  </button>
                  <button
                    className={view === "LIST" ? "active" : ""}
                    onClick={() => setView("LIST")}
                  >
                    {t.register.table}
                  </button>
                </div>
              </div>
              <div className="filter-tabs">
                {[
                  ["ALL", data.length],
                  ["SHIPPED", count],
                  [
                    "BUILDING",
                    data.filter((p) => p.status === "BUILDING").length,
                  ],
                  [
                    "PLANNED",
                    31 - data.filter((p) => p.status !== "PLANNED").length,
                  ],
                ].map(([id, n]) => (
                  <button
                    key={id}
                    onClick={() => setFilter(id)}
                    className={filter === id ? "active" : ""}
                  >
                    {t.register.filters[id]}
                    <sup>{n}</sup>
                  </button>
                ))}
              </div>
              {loading ? (
                <div className="empty">{t.register.loading}</div>
              ) : view === "LIST" ? (
                <Leaderboard
                  data={filtered}
                  metric={metric}
                  setMetric={setMetric}
                  link={link}
                />
              ) : (
                <div className="fiches">
                  {filtered.map((p) => (
                    <Fiche key={p.id} p={p} link={link} />
                  ))}
                  {(filter === "ALL" || filter === "PLANNED") &&
                    Array.from({ length: 31 }, (_, i) => i + 1)
                      .filter((d) => !data.some((p) => p.day === d))
                      .slice(
                        0,
                        filter === "PLANNED"
                          ? 31
                          : Math.max(1, 6 - data.length),
                      )
                      .map((d) => (
                        <div className="fiche blank" key={d}>
                          <div className="fiche-head">
                            <span>
                              {t.exp} {dd(d)}
                            </span>
                            <Stamp value="PLANNED" />
                          </div>
                          <h3>{t.register.blankTitle}</h3>
                          <p className="fiche-pitch">
                            {t.register.blankText(d)}
                          </p>
                        </div>
                      ))}
                </div>
              )}
              {!data.length && !demo && (
                <div className="start-note">
                  <p>{t.register.startNote}</p>
                  <button
                    className="text-button"
                    onClick={() => {
                      setDemo(true);
                      history.replaceState({}, "", "/?demo=1");
                    }}
                  >
                    {t.register.tryDemo} <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </section>
            <section className="manifesto">
              <h2>
                {t.manifesto.title[0]}
                <span className="hl">{t.manifesto.title[1]}</span>
              </h2>
              <div>
                <p>{t.manifesto.text}</p>
                {link(
                  "/journal",
                  <>
                    {t.manifesto.readJournal} <ArrowRight size={16} />
                  </>,
                  "text-button",
                )}
              </div>
            </section>
          </>
        )}
      </main>
      <footer>
        <span className="footer-brand">
          {t.brand}
          <span className="brand-q">?</span>
        </span>
        <span>{t.footer.built}</span>
        <button
          className="text-button"
          onClick={() => {
            setDemo(!demo);
            history.replaceState({}, "", path + (!demo ? "?demo=1" : ""));
          }}
        >
          {demo ? t.footer.demoOff : t.footer.demoOn}
        </button>
      </footer>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      {editing && (
        <ProjectForm
          project={editing}
          onClose={() => setEditing(null)}
          onSaved={saved}
        />
      )}
      {entry && (
        <EntryForm
          project={entry}
          onClose={() => setEntry(null)}
          onSaved={saved}
        />
      )}
    </LangContext.Provider>
  );
}
function DemoNotice() {
  const { t } = useI18n();
  return (
    <p className="demo-notice">
      <strong>{t.demo.label}</strong> {t.demo.text}
    </p>
  );
}
function Stats({ items }) {
  return (
    <dl className={"ledger" + (items.length > 8 ? " ledger-grid" : "")}>
      {items.map(([v, label, mark]) => (
        <div key={label}>
          <dd>{mark ? <span className="hl">{v}</span> : v}</dd>
          <dt>{label}</dt>
        </div>
      ))}
    </dl>
  );
}
function Stamp({ value, big }) {
  const { t } = useI18n();
  return (
    <span
      className={"stamp stamp-" + value?.toLowerCase() + (big ? " big" : "")}
    >
      {t.status[value] || value}
    </span>
  );
}
// Bâtons de comptage : un trait par jour, barré tous les cinq.
function Tally({ day }) {
  const r = (i) => {
    const x = Math.sin(i * 91.7 + 3.1) * 1000;
    return x - Math.floor(x) - 0.5;
  };
  const strokes = Array.from({ length: 31 }, (_, i) => {
    const x0 = 6 + Math.floor(i / 5) * 52,
      k = i % 5;
    const d =
      k < 4
        ? `M${x0 + k * 9 + r(i) * 2} ${6 + r(i + 40) * 3}L${x0 + k * 9 + r(i + 80) * 3} ${46 + r(i + 120) * 2}`
        : `M${x0 - 6} ${37 + r(i) * 3}L${x0 + 34} ${13 + r(i + 7) * 3}`;
    return <path key={i} d={d} className={i < day ? "done" : ""} />;
  });
  return (
    <svg className="tally" viewBox="0 0 330 52" aria-hidden="true">
      {strokes}
    </svg>
  );
}
const Ring = () => (
  <svg className="ring" viewBox="0 0 64 44" aria-hidden="true">
    <path d="M47 6C35-1 10 3 5 17c-5 15 13 25 30 23 17-2 27-13 22-24-3-6-10-9-19-10" />
  </svg>
);
function Month({ data, day, onPick }) {
  const { t } = useI18n();
  return (
    <section className="month">
      <div className="section-heading">
        <div>
          <h2>{t.month.title}</h2>
          <p>{t.month.sub}</p>
        </div>
        <ul className="month-legend" aria-label={t.month.legend}>
          {["shipped", "building", "failed", "planned"].map((k) => (
            <li key={k}>
              <i className={"lg-" + k} /> {t.month[k]}
            </li>
          ))}
        </ul>
      </div>
      <div className="cal">
        {t.month.dows.map((d) => (
          <span className="cal-dow" key={d}>
            {d}
          </span>
        ))}
        {[28, 29, 30].map((n) => (
          <span className="cal-cell out" key={"s" + n} aria-hidden="true">
            <span className="cal-n">{n}</span>
          </span>
        ))}
        {Array.from({ length: 31 }, (_, i) => {
          const d = i + 1,
            p = data.find((p) => p.day === d);
          const cls = [
            "cal-cell",
            p && shipped(p) && "shipped",
            p && "s-" + p.status.toLowerCase(),
            day === d && "today",
            d < day && !p && "missed",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={d}
              className={cls}
              aria-label={t.month.cell(
                d,
                p ? p.name + ", " + t.status[p.status] : t.month.planned,
              )}
              onClick={() => onPick(d, p)}
            >
              <span className="cal-n">
                {d}
                {day === d && <Ring />}
              </span>
              {p && <span className="cal-name">{p.name}</span>}
            </button>
          );
        })}
        <span className="cal-cell out" aria-hidden="true">
          <span className="cal-n">1</span>
        </span>
      </div>
    </section>
  );
}
function Kind({ p }) {
  const { t } = useI18n();
  return (
    <span className="kind">
      <span className="type-tag">
        {t.productType[p.product_type] || p.product_type}
      </span>
      <span className="model-name">{t.model[p.model] || p.model}</span>
    </span>
  );
}
function Fiche({ p, link }) {
  const { t, money, num } = useI18n();
  const h = Math.floor(p.hours),
    m = Math.round((p.hours % 1) * 60);
  return (
    <article
      className={
        "fiche" +
        (p.status === "BUILDING" ? " building" : "") +
        (p.status === "FAILED" ? " failed" : "")
      }
    >
      <div className="fiche-head">
        <span>
          {t.exp} {dd(p.day)}
        </span>
        <Stamp value={p.status} />
      </div>
      <div className="fiche-title">
        {p.logo && <img src={p.logo} alt="" />}
        <h3>{p.name}</h3>
      </div>
      <p className="fiche-cat">
        <Kind p={p} />
      </p>
      <p className="fiche-pitch">{p.pitch}</p>
      <ul className="leaders">
        <li>
          <span>{t.fiche.revenue}</span>
          <b>{money(p.revenue)}</b>
        </li>
        <li>
          <span>{t.fiche.users}</span>
          <b>{num(p.users)}</b>
        </li>
        <li>
          <span>{t.fiche.buildTime}</span>
          <b>
            {h} h {dd(m)}
          </b>
        </li>
      </ul>
      {link(
        "/exp/" + p.slug,
        <>
          {t.fiche.readReport} <ArrowRight size={16} />
        </>,
        "fiche-link",
      )}
    </article>
  );
}
const MONEY_COLUMNS = ["revenue", "mrr", "costs", "profit", "profitHour"];
function Leaderboard({
  data,
  metric,
  setMetric,
  link,
  privateView,
  onEdit,
  onEntry,
}) {
  const { t, money, num, dec } = useI18n();
  const [descending, setDescending] = useState(true),
    [typeFilter, setTypeFilter] = useState("ALL"),
    [modelFilter, setModelFilter] = useState("ALL");
  const columns = privateView
    ? [
        "day",
        "product_type",
        "model",
        "revenue",
        "costs",
        "profit",
        "profitHour",
        "mrr",
        "users",
        "customers",
        "visitors",
        "conversion",
        "hours",
      ]
    : [
        "product_type",
        "model",
        "users",
        "revenue",
        "profit",
        "profitHour",
        "hours",
      ];
  const text = (k) => k === "product_type" || k === "model";
  const cell = (p, k) =>
    k === "product_type"
      ? t.productType[p[k]] || p[k]
      : k === "model"
        ? t.model[p[k]] || p[k]
        : MONEY_COLUMNS.includes(k)
          ? money(p[k])
          : k === "conversion"
            ? dec(p[k]) + " %"
            : k === "hours"
              ? dec(p[k]) + " h"
              : num(p[k]);
  const types = PRODUCT_TYPES.filter((x) =>
      data.some((p) => p.product_type === x),
    ),
    models = BUSINESS_MODELS.filter((x) => data.some((p) => p.model === x));
  const rows = data.filter(
    (p) =>
      (typeFilter === "ALL" || p.product_type === typeFilter) &&
      (modelFilter === "ALL" || p.model === modelFilter),
  );
  const chips = (label, values, labels, value, set) =>
    values.length > 1 && (
      <div className="chips" role="group" aria-label={label}>
        <span>{label}</span>
        {["ALL", ...values].map((x) => (
          <button
            key={x}
            className={value === x ? "active" : ""}
            aria-pressed={value === x}
            onClick={() => set(x)}
          >
            {x === "ALL" ? t.board.all : labels[x] || x}
          </button>
        ))}
      </div>
    );
  return (
    <section className="board">
      {chips(t.board.type, types, t.productType, typeFilter, setTypeFilter)}
      {chips(t.board.model, models, t.model, modelFilter, setModelFilter)}
      <div className="table-toolbar">
        <span>{privateView ? t.board.allColumns : t.board.publicColumns}</span>
        <label>
          {t.board.sortBy}
          <select value={metric} onChange={(e) => setMetric(e.target.value)}>
            {["status", ...columns].map((k) => (
              <option value={k} key={k}>
                {t.cols[k]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th className="rank">#</th>
              <th>{t.board.experiment}</th>
              <th>
                <button
                  onClick={() => {
                    setMetric("status");
                    setDescending(!descending);
                  }}
                >
                  {t.cols.status}{" "}
                  {metric === "status" ? (descending ? "↓" : "↑") : ""}
                </button>
              </th>
              {columns.map((k) => (
                <th
                  key={k}
                  className={
                    (text(k) ? "" : "num") + (metric === k ? " sorted" : "")
                  }
                >
                  <button
                    onClick={() => {
                      if (metric === k) setDescending(!descending);
                      else {
                        setMetric(k);
                        setDescending(!text(k));
                      }
                    }}
                  >
                    {t.cols[k]} {metric === k ? (descending ? "↓" : "↑") : ""}
                  </button>
                </th>
              ))}
              {privateView && <th>{t.board.actions}</th>}
            </tr>
          </thead>
          <tbody>
            {[...rows]
              .sort(
                (a, b) =>
                  (descending ? -1 : 1) *
                  (typeof a[metric] === "string"
                    ? a[metric].localeCompare(b[metric])
                    : (a[metric] || 0) - (b[metric] || 0)),
              )
              .map((p, i) => (
                <tr key={p.id}>
                  <td className="rank">
                    <span className={i === 0 ? "first" : ""}>{i + 1}</span>
                  </td>
                  <td>
                    {link(
                      "/exp/" + p.slug,
                      <>
                        <small>
                          {t.exp} {dd(p.day)}
                        </small>
                        <strong>{p.name}</strong>
                      </>,
                      "row-link",
                    )}
                  </td>
                  <td>
                    <Stamp value={p.status} />
                  </td>
                  {columns.map((k) => (
                    <td
                      key={k}
                      className={
                        (text(k) ? "text" : "num") +
                        (metric === k ? " sorted" : "") +
                        (k === "profit" && p.profit < 0 ? " negative" : "")
                      }
                    >
                      {cell(p, k)}
                    </td>
                  ))}
                  {privateView && (
                    <td className="row-actions">
                      <button className="text-button" onClick={() => onEdit(p)}>
                        {t.board.edit}
                      </button>
                      <button
                        className="text-button"
                        onClick={() => onEntry(p)}
                      >
                        {t.board.addData}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
        {!rows.length && <div className="empty">{t.board.none}</div>}
      </div>
    </section>
  );
}
function Experiment({ slug, demo, data, link }) {
  const { t, loc, money, num, dec, longDate, category } = useI18n();
  const [p, setP] = useState(null),
    [err, setErr] = useState(""),
    [period, setPeriod] = useState("ALL"),
    [graph, setGraph] = useState("revenue");
  useEffect(() => {
    setP(null);
    setErr("");
    if (demo) {
      const v = data.find((p) => p.slug === slug);
      setP(
        v
          ? {
              ...v,
              revenues: Object.entries(v.revenueSources || {}).map(
                ([type, amount]) => ({ amount, type, date: v.launch }),
              ),
              snapshots: [],
              logs: [
                { date: v.launch + "T09:00", title: t.demo.logStart },
                { date: v.launch + "T13:21", title: t.demo.logLive },
              ],
            }
          : null,
      );
      if (!v) setErr(t.report.notFound);
    } else
      api("/projects/" + slug)
        .then(setP)
        .catch((e) => setErr(e.message));
  }, [slug, demo, data]);
  if (err)
    return (
      <div className="empty">
        {err}. {link("/", t.report.back, "text-button")}
      </div>
    );
  if (!p) return <div className="empty">{t.report.loading}</div>;
  const s = t.report.sections;
  const sources = Object.entries(p.revenueSources || {}).sort(
    (a, b) => b[1] - a[1],
  );
  return (
    <>
      <div className="report-back">
        {link(
          "/",
          <>
            <ArrowLeft size={16} /> {t.report.back}
          </>,
          "text-button",
        )}
        <span>
          {p.launch
            ? t.report.launchedOn(longDate(p.launch))
            : t.report.notPublished}
        </span>
      </div>
      {demo && <DemoNotice />}
      <section className="report-hero">
        <div className="leaf" aria-hidden="true">
          <span>{t.month.title}</span>
          <strong>{p.day}</strong>
          <small>{t.report.leafSub(p.day)}</small>
        </div>
        <div className="report-title">
          <h1>{p.name}</h1>
          <p>{p.pitch}</p>
          <Stamp value={p.status} big />
        </div>
      </section>
      <p className="report-meta">
        <Kind p={p} />
        {p.category && <span>{category(p.category)}</span>}
        <span>{p.stack || t.report.stackTodo}</span>
        {p.url && (
          <a href={p.url} target="_blank" rel="noreferrer">
            {t.report.visit} <ArrowUpRight size={15} />
          </a>
        )}
      </p>
      <Stats
        items={[
          [money(p.revenue), t.stats.revenue, true],
          [money(p.costs), t.stats.costs],
          [money(p.profit), t.stats.profit],
          [money(p.mrr), t.stats.mrr],
          [num(p.visitors), t.stats.visitors],
          [num(p.users), t.stats.users],
          [num(p.customers), t.stats.customers],
          [
            dec(p.visitors ? (100 * p.customers) / p.visitors : 0) + " %",
            t.stats.conversion,
          ],
        ]}
      />
      <div className="report-grid">
        <div className="report-body">
          <section className="report-section">
            <h3>
              <span>1.</span> {s.hypothesis}
            </h3>
            <p>{p.hypothesis || t.report.hypothesisTodo}</p>
          </section>
          <section className="report-section">
            <h3>
              <span>2.</span> {s.build}
            </h3>
            <p>
              {t.report.buildText(dec(p.hours))}{" "}
              {p.launch
                ? t.report.publishedOn(longDate(p.launch))
                : t.report.publishSoon}{" "}
              {p.description}
            </p>
          </section>
          <section className="report-section">
            <h3>
              <span>3.</span> {s.monetization}
            </h3>
            <p>{t.report.mainModel(t.model[p.model] || p.model)}</p>
            {sources.length ? (
              <ul className="leaders sources">
                {sources.map(([type, v]) => (
                  <li key={type}>
                    <span>{t.model[type] || type}</span>
                    <b>{money(v)}</b>
                  </li>
                ))}
                {sources.length > 1 && (
                  <li className="total">
                    <span>{t.report.total}</span>
                    <b>{money(p.revenue)}</b>
                  </li>
                )}
              </ul>
            ) : (
              <p className="muted">{t.report.noRevenue}</p>
            )}
          </section>
          <section className="report-section">
            <h3>
              <span>4.</span> {s.result}
            </h3>
            <p>{p.result || t.report.resultTodo}</p>
          </section>
          <section className="report-section decision">
            <h3>
              <span>5.</span> {s.decision}
            </h3>
            <p>
              <span className="hl">
                {t.decision[p.decision] || p.decision || t.decision.OBSERVE}
              </span>
            </p>
          </section>
          {p.image && (
            <img
              className="product-image"
              src={p.image}
              alt={t.report.screenshotOf(p.name)}
            />
          )}
        </div>
        <aside className="build-log">
          <h2>{t.report.logTitle}</h2>
          <p className="aside-sub">{t.report.logSub}</p>
          {p.logs?.length ? (
            <ol>
              {p.logs.map((l, i) => (
                <li key={i}>
                  <time>
                    {new Date(l.date).toLocaleString(loc, {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                  <strong>{l.title}</strong>
                  {l.description && <p>{l.description}</p>}
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">{t.report.logEmpty}</p>
          )}
        </aside>
      </div>
      <div className="section-heading measures">
        <div>
          <h2>{t.report.measures}</h2>
          <p>{t.report.measuresSub}</p>
        </div>
        <div className="view-switch">
          {["7", "30", "ALL"].map((v) => (
            <button
              className={period === v ? "active" : ""}
              onClick={() => setPeriod(v)}
              key={v}
            >
              {v === "ALL" ? t.report.all : t.report.days(v)}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-tabs">
        {["revenue", "mrr", "users", "visitors"].map((k) => (
          <button
            key={k}
            className={graph === k ? "active" : ""}
            onClick={() => setGraph(k)}
          >
            {t.cols[k]}
          </button>
        ))}
      </div>
      <Chart project={p} metric={graph} period={period} />
      <div className="report-end" />
    </>
  );
}
function Chart({ project, metric, period }) {
  const { t, money, num, longDate } = useI18n();
  const rows =
    metric === "revenue" ? project.revenues || [] : project.snapshots || [];
  const daily = {};
  rows.forEach((r) => {
    if (!r.date) return;
    const d = r.date.slice(0, 10);
    daily[d] =
      metric === "revenue" ? (daily[d] || 0) + r.amount : r[metric] || 0;
  });
  let points = Object.entries(daily).sort((a, b) => a[0].localeCompare(b[0]));
  if (period !== "ALL") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(period));
    points = points.filter(([d]) => d >= cutoff.toISOString().slice(0, 10));
  }
  if (!points.length)
    return <div className="empty chart-empty">{t.report.chartEmpty}</div>;
  const isMoney = ["revenue", "mrr"].includes(metric);
  const max = Math.max(...points.map((p) => p[1]), 1);
  const xy = points.map((p, i) => [
    points.length === 1 ? 500 : (i / (points.length - 1)) * 1000,
    170 - (p[1] / max) * 150,
  ]);
  return (
    <div className="chart">
      <span className="chart-max">{isMoney ? money(max) : num(max)}</span>
      <svg
        viewBox="0 0 1000 190"
        role="img"
        aria-label={t.report.chartLabel(t.cols[metric])}
      >
        <path d="M0 20H1000 M0 95H1000 M0 170H1000" className="chart-grid" />
        {xy.length > 1 && (
          <polygon
            className="chart-area"
            points={`0,170 ${xy.map((p) => p.join(",")).join(" ")} 1000,170`}
          />
        )}
        <polyline
          className="chart-line"
          points={xy.map((p) => p.join(",")).join(" ")}
        />
        {xy.map(([x, y], i) => (
          <circle key={points[i][0]} cx={x} cy={y} r="5" className="chart-dot">
            <title>
              {longDate(points[i][0])} :{" "}
              {isMoney ? money(points[i][1]) : num(points[i][1])}
            </title>
          </circle>
        ))}
      </svg>
      <div className="chart-dates">
        <span>{longDate(points[0][0])}</span>
        <span>{longDate(points.at(-1)[0])}</span>
      </div>
    </div>
  );
}
function Journal({ data, demo, link }) {
  const { t, loc } = useI18n();
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    if (!demo)
      Promise.all(data.map((p) => api("/projects/" + p.slug)))
        .then((items) =>
          setLogs(
            items
              .flatMap((p) => p.logs.map((l) => ({ ...l, project: p })))
              .sort((a, b) => b.date.localeCompare(a.date)),
          ),
        )
        .catch(() => setLogs([]));
  }, [data, demo]);
  return (
    <>
      <div className="section-intro">
        <p className="kicker">{t.journal.kicker}</p>
        <h1>
          {t.journal.title[0]} <em>{t.journal.title[1]}</em>
        </h1>
        <p className="intro-text">{t.journal.intro}</p>
      </div>
      {demo && <DemoNotice />}
      <div className="journal">
        {(demo
          ? data
              .filter(shipped)
              .map((p) => ({
                date: p.launch,
                title: t.journal.isLive(p.name),
                description: p.pitch,
                project: p,
              }))
              .reverse()
          : logs
        ).map((l, i) => {
          const d = new Date(l.date.slice(0, 10) + "T12:00");
          return (
            <article className="journal-row" key={i}>
              <div className="leaf small" aria-hidden="true">
                <span>{d.toLocaleDateString(loc, { month: "short" })}</span>
                <strong>{d.getDate()}</strong>
              </div>
              <div>
                <p className="journal-meta">
                  {t.exp} {dd(l.project.day)} · {l.project.name}
                </p>
                <h2>{l.title}</h2>
                {l.description && <p>{l.description}</p>}
              </div>
              {link(
                "/exp/" + l.project.slug,
                <ArrowUpRight size={22} aria-label={t.fiche.readReport} />,
                "journal-go",
              )}
            </article>
          );
        })}
      </div>
      {!demo && !logs.length && <div className="empty">{t.journal.empty}</div>}
    </>
  );
}
function Login({ session, onLogin }) {
  const { t } = useI18n();
  const [password, setPassword] = useState(""),
    [error, setError] = useState("");
  return (
    <form
      className="login"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await api("/login", "POST", { password });
          onLogin();
        } catch (e) {
          setError(e.message);
        }
      }}
    >
      <h2>{t.login.title}</h2>
      {session?.configured === false ? (
        <p>{t.login.notConfigured}</p>
      ) : (
        <>
          <label>
            {t.login.password}
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="button">
            {t.login.enter} <ArrowRight size={16} />
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </form>
  );
}
const statuses = [
  "PLANNED",
  "BUILDING",
  "SHIPPED",
  "PROMISING",
  "FAILED",
  "PROFITABLE",
  "PAUSED",
];
function Modal({ title, onClose, children }) {
  const { t } = useI18n();
  const box = useRef(null);
  useEffect(() => {
    const before = document.activeElement;
    box.current?.querySelector("button,input,select,textarea")?.focus();
    const h = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const nodes = [
          ...box.current.querySelectorAll(
            "button,input,select,textarea,a[href]",
          ),
        ].filter((n) => !n.disabled);
        if (e.shiftKey && document.activeElement === nodes[0]) {
          e.preventDefault();
          nodes.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
          e.preventDefault();
          nodes[0]?.focus();
        }
      }
    };
    document.body.style.overflow = "hidden";
    addEventListener("keydown", h);
    return () => {
      document.body.style.overflow = "";
      removeEventListener("keydown", h);
      before?.focus();
    };
  }, []);
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={box}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label={t.close}>
            <X />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function ProjectForm({ project, onClose, onSaved }) {
  const { t, category } = useI18n();
  const f = t.form;
  const [form, setForm] = useState(project),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [confirmDelete, setConfirmDelete] = useState(false);
  const field = (key, label, type = "text") => (
    <label key={key}>
      {label}
      {type === "textarea" ? (
        <textarea
          value={form[key] || ""}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      ) : (
        <input
          type={
            type === "url" && form[key]?.startsWith("/uploads/") ? "text" : type
          }
          value={form[key] ?? ""}
          required={["day", "name", "slug"].includes(key)}
          min={key === "day" ? 1 : 0}
          max={key === "day" ? 31 : undefined}
          step={key === "hours" ? ".01" : undefined}
          onChange={(e) =>
            setForm({
              ...form,
              [key]:
                type === "number" ? Number(e.target.value) : e.target.value,
              ...(key === "name" && !project.id
                ? {
                    slug: e.target.value
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[̀-ͯ]/g, "")
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, ""),
                  }
                : {}),
            })
          }
        />
      )}
    </label>
  );
  const select = (key, label, options) => (
    <label>
      {label}
      <select
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      >
        {options.map(([value, name]) => (
          <option key={value} value={value}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <Modal title={project.id ? f.editTitle : f.newTitle} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api(
              "/admin/projects" + (project.id ? "/" + project.id : ""),
              project.id ? "PUT" : "POST",
              form,
            );
            onSaved();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          {field("day", f.day, "number")}
          {field("name", f.name)}
          {field("slug", f.slug)}
          {field("launch", f.launch, "date")}
          {select(
            "status",
            f.status,
            statuses.map((s) => [s, t.status[s]]),
          )}
          {select(
            "product_type",
            f.productType,
            PRODUCT_TYPES.map((x) => [x, t.productType[x]]),
          )}
          {select(
            "model",
            f.model,
            BUSINESS_MODELS.map((x) => [x, t.model[x]]),
          )}
          {field("hours", f.hours, "number")}
          {select("category", f.category, [
            ["", "—"],
            ...[...new Set([...Object.keys(t.category), form.category])]
              .filter(Boolean)
              .map((c) => [c, category(c)]),
          ])}
          {field("url", f.url, "url")}
          {field("image", f.image, "url")}
          {field("logo", f.logo, "url")}
          {field("stack", f.stack)}
          {select("decision", f.decision, Object.entries(t.decision))}
        </div>
        <div className="form-grid">
          {["image", "logo"].map((key) => (
            <label key={key}>
              {key === "image" ? f.uploadImage : f.uploadLogo}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5000000) {
                    setError(f.imageLimit);
                    return;
                  }
                  setUploading(true);
                  try {
                    const value = await new Promise((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(reader.result);
                      reader.onerror = reject;
                      reader.readAsDataURL(file);
                    });
                    const result = await api("/admin/uploads", "POST", {
                      data: value,
                    });
                    setForm((v) => ({ ...v, [key]: result.url }));
                    setError("");
                  } catch (e) {
                    setError(e.message);
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              {form[key] && (
                <img
                  src={form[key]}
                  alt={f.uploaded}
                  style={{ maxWidth: 160, maxHeight: 90, objectFit: "contain" }}
                />
              )}
            </label>
          ))}
        </div>
        {field("pitch", f.pitch)}
        {field("hypothesis", f.hypothesis, "textarea")}
        {field("description", f.description, "textarea")}
        {field("result", f.result, "textarea")}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button disabled={busy || uploading} className="button">
            {busy ? f.saving : f.saveExperiment}
          </button>
          {project.id && (
            <button
              className="text-button danger"
              type="button"
              onClick={async () => {
                if (!confirmDelete) {
                  setConfirmDelete(true);
                  return;
                }
                try {
                  await api("/admin/projects/" + project.id, "DELETE");
                  onSaved();
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              {confirmDelete ? f.confirmDelete : f.delete}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
function EntryForm({ project, onClose, onSaved }) {
  const { t } = useI18n();
  const f = t.form;
  const [type, setType] = useState("revenue"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal title={f.entryTitle(project.name)} onClose={onClose}>
      <div className="filter-tabs">
        {["revenue", "expense", "snapshot", "log"].map((k) => (
          <button
            key={k}
            className={type === k ? "active" : ""}
            onClick={() => setType(k)}
          >
            {f.tabs[k]}
          </button>
        ))}
      </div>
      <form
        key={type}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const v = Object.fromEntries(new FormData(e.target));
          for (const k of ["amount", "mrr"])
            if (k in v) v[k] = Math.round(Number(v[k]) * 100);
          for (const k of ["visitors", "users", "active", "customers"])
            if (k in v) v[k] = Number(v[k]);
          try {
            await api(`/admin/projects/${project.id}/${type}`, "POST", v);
            onSaved();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          {f.date}
          <input
            name="date"
            type={type === "log" ? "datetime-local" : "date"}
            defaultValue={new Date()
              .toISOString()
              .slice(0, type === "log" ? 16 : 10)}
            required
          />
        </label>
        {["revenue", "expense"].includes(type) && (
          <>
            <label>
              {f.amount}
              <input name="amount" type="number" min="0" step="0.01" required />
            </label>
            <label>
              {type === "revenue" ? f.type : f.category}
              <select
                name={type === "revenue" ? "type" : "category"}
                defaultValue={type === "revenue" ? project.model : undefined}
              >
                {Object.entries(type === "revenue" ? t.model : t.expense).map(
                  ([value, name]) => (
                    <option key={value} value={value}>
                      {name}
                    </option>
                  ),
                )}
              </select>
            </label>
          </>
        )}
        {type === "snapshot" && (
          <>
            <p className="muted">{f.snapshotHelp}</p>
            <div className="form-grid">
              {[
                ["visitors", f.visitors],
                ["users", f.signups],
                ["active", f.activeUsers],
                ["customers", f.payingCustomers],
                ["mrr", f.mrr],
              ].map(([k, label]) => (
                <label key={k}>
                  {label}
                  <input
                    name={k}
                    type="number"
                    min="0"
                    step={k === "mrr" ? ".01" : "1"}
                    required
                    defaultValue={0}
                  />
                </label>
              ))}
            </div>
          </>
        )}
        {type === "log" && (
          <label>
            {f.title}
            <input name="title" required />
          </label>
        )}
        {type !== "snapshot" && (
          <label>
            {f.descriptionShort}
            <textarea name="description" />
          </label>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy ? f.saving : f.save}
        </button>
      </form>
    </Modal>
  );
}
function Bars({ title, rows }) {
  const { money } = useI18n();
  const max = Math.max(1, ...rows.map((r) => r[2]));
  return (
    <div className="bars">
      <h3>{title}</h3>
      <ol>
        {rows.map(([key, label, value]) => (
          <li key={key}>
            <span className="bar-label">{label}</span>
            <span className="bar-track" aria-hidden="true">
              <i style={{ width: (100 * value) / max + "%" }} />
            </span>
            <b>{money(value)}</b>
          </li>
        ))}
      </ol>
    </div>
  );
}
// Ce qui rapporte : revenus par modèle, par type, matrice type × modèle, records.
function Insights({ data }) {
  const { t, money, num } = useI18n();
  const live = data.filter((p) => p.status !== "PLANNED");
  const heading = (
    <div className="section-heading">
      <div>
        <h2>{t.insights.title}</h2>
        <p>{t.insights.sub}</p>
      </div>
    </div>
  );
  if (!live.length)
    return (
      <section className="insights">
        {heading}
        <p className="empty">{t.insights.empty}</p>
      </section>
    );
  const byModel = {},
    byType = {},
    cells = {};
  for (const p of live) {
    const sources = p.revenueSources || {};
    byModel[p.model] ??= 0;
    for (const [m, amount] of Object.entries(sources))
      byModel[m] = (byModel[m] || 0) + amount;
    byType[p.product_type] = (byType[p.product_type] || 0) + (p.revenue || 0);
    // Une case est « testée » par le modèle principal et par chaque source de revenus.
    for (const m of new Set([p.model, ...Object.keys(sources)]))
      (cells[p.product_type + "|" + m] ??= []).push({
        day: p.day,
        name: p.name,
        earned: (sources[m] || 0) > 0,
      });
  }
  const rank = (totals, labels) =>
    Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => [key, labels[key] || key, value]);
  const modelRows = rank(byModel, t.model),
    typeRows = rank(byType, t.productType);
  const best = (key) => {
    const p = [...live].sort((a, b) => (b[key] || 0) - (a[key] || 0))[0];
    return p && p[key] > 0 ? p : null;
  };
  const records = [
    [t.insights.topRevenue, best("revenue"), (p) => money(p.revenue)],
    [t.insights.topProfit, best("profit"), (p) => money(p.profit)],
    [t.insights.topUsers, best("users"), (p) => num(p.users)],
    [t.insights.topHour, best("profitHour"), (p) => money(p.profitHour) + " / h"],
  ];
  const keep = live.filter((p) => p.decision === "CONTINUE");
  const usedModels = new Set(Object.keys(cells).map((k) => k.split("|")[1]));
  return (
    <section className="insights">
      {heading}
      <div className="insights-grid">
        <Bars title={t.insights.byModel} rows={modelRows} />
        <Bars title={t.insights.byType} rows={typeRows} />
      </div>
      <div className="matrix-block">
        <h3>{t.insights.matrix}</h3>
        <p className="matrix-sub">
          {t.insights.matrixSub}{" "}
          {t.insights.tested(
            Object.keys(cells).length,
            PRODUCT_TYPES.length * BUSINESS_MODELS.length,
          )}
        </p>
        <div className="table-scroll">
          <table className="matrix">
            <thead>
              <tr>
                <th className="corner">{t.insights.matrixCorner}</th>
                {BUSINESS_MODELS.map((m) => (
                  <th
                    key={m}
                    scope="col"
                    className={usedModels.has(m) ? "on" : ""}
                  >
                    <span>{t.model[m]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRODUCT_TYPES.map((type) => (
                <tr
                  key={type}
                  className={
                    live.some((p) => p.product_type === type) ? "on" : ""
                  }
                >
                  <th scope="row">{t.productType[type]}</th>
                  {BUSINESS_MODELS.map((m) => (
                    <td key={m}>
                      {(cells[type + "|" + m] || []).map((c) => (
                        <span
                          key={c.day}
                          title={c.name}
                          className={"chip" + (c.earned ? " earned" : "")}
                        >
                          {dd(c.day)}
                        </span>
                      ))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="matrix-legend">
          <span className="chip earned">07</span> {t.insights.earned}
          <span className="chip">07</span> {t.insights.zero}
        </p>
      </div>
      <div className="records">
        <h3>{t.insights.records}</h3>
        <ul className="leaders">
          {records.map(([label, p, value]) => (
            <li key={label}>
              <span>{label}</span>
              <b>{p ? `${p.name} · ${value(p)}` : t.insights.nobody}</b>
            </li>
          ))}
          {[
            [t.insights.bestModel, modelRows[0]],
            [t.insights.bestType, typeRows[0]],
          ].map(([label, row]) => (
            <li key={label}>
              <span>{label}</span>
              <b>
                {row?.[2] > 0
                  ? `${row[1]} · ${money(row[2])}`
                  : t.insights.nobody}
              </b>
            </li>
          ))}
          <li>
            <span>{t.insights.keep}</span>
            <b>
              {keep.length
                ? keep.map((p) => p.name).join(", ")
                : t.insights.nobody}
            </b>
          </li>
        </ul>
      </div>
    </section>
  );
}
