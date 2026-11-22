import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(__dirname, "..", "src", "index.js");

const child = spawn(process.execPath, [serverPath], {
  stdio: ["pipe", "pipe", "pipe"],
});

const requests = [
  { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "smoke-test", version: "1.0.0" } } },
  { jsonrpc: "2.0", id: 2, method: "tools/list" },
  { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_state_minimums", arguments: { state: "CA" } } },
  { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "compare_state_minimums", arguments: { states: ["TX", "NC", "NH"] } } },
  { jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "get_coverage_guide", arguments: { slug: "full-coverage-vs-liability" } } },
  { jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "get_quote_comparison_link", arguments: { zip_code: "77380" } } },
  { jsonrpc: "2.0", id: 7, method: "resources/list" },
  { jsonrpc: "2.0", id: 8, method: "resources/read", params: { uri: "insurancepanda://datasets/state-minimums-2026" } },
];

let buffer = "";
const responses = new Map();

child.stdout.on("data", (chunk) => {
  buffer += chunk.toString("utf8");
  const lines = buffer.split("\n");
  buffer = lines.pop();
  for (const line of lines) {
    if (!line.trim()) continue;
    const msg = JSON.parse(line);
    responses.set(msg.id, msg);
  }
  if (responses.size === requests.length) {
    child.stdin.end();
  }
});

let stderr = "";
child.stderr.on("data", (d) => (stderr += d.toString("utf8")));

for (const req of requests) {
  child.stdin.write(JSON.stringify(req) + "\n");
}

child.on("close", (code) => {
  assert.equal(code, 0, `Server exited with ${code}. stderr: ${stderr}`);
  assert.equal(responses.get(1).result.serverInfo.name, "insurance-panda-mcp");
  assert.equal(responses.get(2).result.tools.length, 4);

  const ca = JSON.parse(responses.get(3).result.content[0].text);
  assert.equal(ca.liability_shorthand, "30/60/15");

  const cmp = JSON.parse(responses.get(4).result.content[0].text);
  assert.equal(cmp.count, 3);

  const guide = JSON.parse(responses.get(5).result.content[0].text);
  assert.equal(guide.slug, "full-coverage-vs-liability");

  const link = JSON.parse(responses.get(6).result.content[0].text);
  assert.equal(link.zip_code, "77380");
  assert.equal(link.account_required, false);

  assert.equal(responses.get(7).result.resources.length, 2);

  const ds = JSON.parse(responses.get(8).result.contents[0].text);
  assert.equal(ds.jurisdiction_count, 51);

  console.log("ALL SMOKE TESTS PASSED (8/8 checks, 51 jurisdictions verified).");
});
