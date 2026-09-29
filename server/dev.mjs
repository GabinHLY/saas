import { spawn } from "node:child_process";
const children = [
  spawn(process.execPath, ["--env-file-if-exists=.env", "--watch", "server/index.mjs"], {
    stdio: "inherit",
  }),
  spawn("npx", ["vite"], { stdio: "inherit" }),
];
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    children.forEach((p) => p.kill(signal));
    process.exit();
  });
