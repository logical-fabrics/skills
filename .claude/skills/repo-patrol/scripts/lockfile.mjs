// lockfile から、パッケージごとの解決（どこから取るか）を読む。check-diff.mjs と publisher-check.mjs が使う。

const REGISTRY_URL = /^https:\/\/registry\.npmjs\.org\//;

// pnpm-lock.yaml の packages: から「パッケージの鍵 → resolution」を取り出す。
export function pnpmResolutions(text) {
  const resolutions = new Map();
  let inPackages = false;
  let key = null;
  for (const line of text.split("\n")) {
    if (/^\S/.test(line)) {
      inPackages = line.trim() === "packages:";
      key = null;
      continue;
    }
    if (!inPackages) continue;
    const keyMatch = line.match(/^ {2}(\S.*):\s*$/);
    if (keyMatch) {
      key = keyMatch[1].replace(/^'(.*)'$/, "$1");
      // resolution の行がなければこのまま残り、レジストリ以外の扱いになる
      resolutions.set(key, { text: "（resolution がない）", registry: false });
      continue;
    }
    const resolutionMatch = line.match(/^ {3,}resolution:\s*(.*)$/);
    if (key && resolutionMatch) {
      const value = resolutionMatch[1].trim();
      resolutions.set(key, {
        text: value,
        registry: /^\{integrity: [A-Za-z0-9+/=-]+\}$/.test(value),
      });
    }
  }
  return resolutions;
}

// package-lock.json の packages から「パスと版 → resolved と integrity」を取り出す。古い形式は null。
export function npmResolutions(text) {
  const lock = JSON.parse(text);
  if (!lock.packages) return null;
  const resolutions = new Map();
  for (const [key, entry] of Object.entries(lock.packages)) {
    if (key === "") continue;
    const value = entry.link
      ? `link:${entry.resolved}`
      : `${entry.version}|${entry.resolved ?? ""}|${entry.integrity ?? ""}`;
    resolutions.set(`${key}@${entry.version ?? ""}`, {
      text: value,
      registry:
        !entry.link &&
        typeof entry.integrity === "string" &&
        REGISTRY_URL.test(entry.resolved ?? ""),
    });
  }
  return resolutions;
}
