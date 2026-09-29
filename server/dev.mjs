import { spawn } from "node:child_process";
// En développement, l’API reste sur 3001 (cible du proxy Vite) ;
// une variable PORT éventuelle s’applique à Vite, pas à l’API.
const children = [
  spawn(
    process.execPath,
    ["--env-file-if-exists=.env", "--watch", "server/index.mjs"],
    { stdio: "inherit", env: { ...process.env, PORT: "3001" } },
  ),
  spawn(
    "npx",
    ["vite", "--port", process.env.PORT || "5173", "--strictPort"],
    { stdio: "inherit" },
  ),
];
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    children.forEach((p) => p.kill(signal));
    process.exit();
  });
