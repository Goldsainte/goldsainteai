// tests/unit/db/seed_data_script.test.js
// Basic sanity checks for SEED_DATA_SCRIPT.sql to ensure marketplace creators are seeded correctly.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to SEED_DATA_SCRIPT.sql in project root
const SEED_PATH = resolve(__dirname, "..", "..", "..", "SEED_DATA_SCRIPT.sql");

const sql = readFileSync(SEED_PATH, "utf8");

test("seed script includes three creator profiles with account_type=creator", () => {
  const creatorIds = [
    "00000000-0000-0000-0000-000000000002",
    "00000000-0000-0000-0000-000000000003",
    "00000000-0000-0000-0000-000000000004",
  ];

  for (const id of creatorIds) {
    const escapedId = id.replace(/[-]/g, "[-]");
    const pattern = new RegExp(
      `${escapedId}[\\s\\S]*account_type\\s*[,=]\\s*'creator'`,
      "m"
    );

    assert.ok(
      pattern.test(sql),
      `Expected SEED_DATA_SCRIPT.sql to mark ${id} with account_type='creator'`
    );
  }
});

test("seed script defines app_role enum with creator role", () => {
  assert.ok(
    /CREATE TYPE\s+app_role\s+AS ENUM[\s\S]*'creator'/i.test(sql),
    "Expected app_role enum to include creator role"
  );
});

test("seed script seeds user_roles for creators", () => {
  const match = /INSERT INTO\s+user_roles[\s\S]*VALUES[\s\S]*00000000-0000-0000-0000-000000000002[\s\S]*'creator'/i.test(
    sql
  );
  assert.ok(
    match,
    "Expected SEED_DATA_SCRIPT.sql to insert creator roles into user_roles table"
  );
});
