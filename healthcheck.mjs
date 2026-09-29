// Utilisé par le HEALTHCHECK du Dockerfile : même port que le serveur.
const url = `http://127.0.0.1:${Number(process.env.PORT) || 3001}/api/session`;
try {
  const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!r.ok) throw Error(`statut ${r.status}`);
} catch (e) {
  console.error(`Healthcheck ${url} : ${e.cause?.code || e.message}`);
  process.exit(1);
}
