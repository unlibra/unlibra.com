// I5: the rules for the GitHub Actions workflow, checked on the file's text so that a later edit cannot quietly
// break them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const dir = new URL("../.github/workflows/", import.meta.url);
const workflows = readdirSync(dir).map((name) => [
  name,
  readFileSync(new URL(name, dir), "utf8"),
]);

test("I5: the test workflow runs every check, on push and pull request", () => {
  const text = readFileSync(new URL("test.yml", dir), "utf8");
  assert.match(text, /^on:\n {2}push:\n {2}pull_request:\n/m);
  assert.match(text, /node-version-file: \.node-version/);
  const runs = [...text.matchAll(/^\s+(?:- )?run: (.+)$/gm)].map((m) => m[1]);
  const order = [
    "npm ci",
    "npm run build",
    "npm run lint",
    "npm run format:check",
    "npm test",
    "npx playwright test",
  ].map((command) => runs.indexOf(command));
  assert.ok(
    order.every((index) => index >= 0),
    `missing: ${runs.join(" | ")}`,
  );
  assert.deepEqual(
    [...order].sort((a, b) => a - b),
    order,
  );
  // Chromium only.
  assert.ok(
    runs
      .filter((command) => command.includes("playwright install"))
      .every((command) => command.endsWith(" chromium")),
  );
});

/** Workflows that may write: by name, so a new one starts read-only. */
const WRITERS = ["dependabot-auto-merge.yml"];

const withoutComments = (text) => text.replace(/(^|\s)#.*$/gm, "");

test("I5: every workflow sets its permissions once and pins the actions of GitHub", () => {
  assert.ok(workflows.length > 0);
  for (const [name, text] of workflows) {
    assert.equal(text.match(/^\s*permissions:/gm).length, 1, name);
    assert.match(text, /^permissions:\n/m, name);
    const uses = [...text.matchAll(/uses: (\S+)/g)].map((m) => m[1]);
    assert.ok(uses.length > 0, name);
    for (const action of uses) {
      assert.match(
        action,
        /^(actions|dependabot)\/[\w-]+@[0-9a-f]{40}$/,
        `${name}: ${action}`,
      );
    }
  }
});

test("I5: the workflows other than the writers only read and use no secrets", () => {
  for (const [name, text] of workflows) {
    if (WRITERS.includes(name)) continue;
    assert.match(text, /^permissions:\n {2}contents: read\n(?! )/m, name);
    assert.doesNotMatch(
      withoutComments(text),
      /secrets\.|GITHUB_TOKEN|github\.token/,
      name,
    );
  }
});

test("I5: the auto-merge workflow writes only for Dependabot's pull requests, without their code", () => {
  const text = readFileSync(new URL("dependabot-auto-merge.yml", dir), "utf8");
  const code = withoutComments(text);
  assert.match(code, /^on: pull_request\n/m);
  assert.doesNotMatch(code, /pull_request_target|workflow_run/);
  assert.match(
    code,
    /^permissions:\n {2}contents: write\n {2}pull-requests: write\n(?! )/m,
  );
  assert.match(
    code,
    /^ {4}if: github\.event\.pull_request\.user\.login == 'dependabot\[bot\]'$/m,
  );
  assert.deepEqual(
    [...code.matchAll(/secrets\.(\w+)/g)].map((m) => m[1]),
    ["GITHUB_TOKEN"],
  );
  assert.doesNotMatch(code, /actions\/checkout/);
  assert.match(code, /gh pr merge --auto/);
});
