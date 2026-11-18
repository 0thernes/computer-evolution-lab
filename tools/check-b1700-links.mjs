// Checks every link in the B1700 dossier (src/machines/b1700-dossier.js) resolves.
// Sites that refuse automated clients are checked through an equivalent public API:
// DOIs via the doi.org handle API, UMN UMedia items via their .json endpoint.
import vm from "node:vm";
import fs from "node:fs";

const ctx = {};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL("../src/machines/b1700-dossier.js", import.meta.url), "utf8"), ctx);
const urls = [...new Set(ctx.B1700_DOSSIER.sections.flatMap((s) => s.items.flatMap((i) => (i.links || []).map((l) => l.url))))];
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";

async function check(url) {
  let probe = url;
  let how = "GET";
  const doi = url.match(/^https:\/\/doi\.org\/(.+)$/);
  if (doi) {
    const r = await fetch(`https://doi.org/api/handles/${doi[1]}`);
    const j = await r.json();
    return { url, ok: j.responseCode === 1, how: "doi.org handle API", status: j.responseCode };
  }
  if (/umedia\.lib\.umn\.edu\/item\//.test(url)) {
    probe = url + ".json";
    how = "UMedia .json";
  }
  const r = await fetch(probe, { method: "GET", headers: { "User-Agent": UA }, redirect: "follow" });
  await r.body?.cancel();
  return { url, ok: r.ok, how, status: r.status };
}

let bad = 0;
for (const u of urls) {
  try {
    const r = await check(u);
    if (!r.ok) bad++;
    console.log(`${r.ok ? "ok " : "BAD"} ${String(r.status).padEnd(4)} ${r.how.padEnd(18)} ${u}`);
  } catch (e) {
    bad++;
    console.log(`BAD ERR  ${u} ${e.message}`);
  }
}
console.log(`${urls.length - bad}/${urls.length} links resolve`);
process.exit(bad ? 1 : 0);
