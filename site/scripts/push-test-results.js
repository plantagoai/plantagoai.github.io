#!/usr/bin/env node
/**
 * Run all shared package tests and push results to Firestore.
 *
 * Usage: node scripts/push-test-results.js
 *
 * Runs vitest in each @plantagoai/* package, parses results,
 * and writes a summary to plantagoai Firestore: admin/testResults
 */

import { execSync } from "child_process";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { existsSync } from "fs";
import { resolve, join } from "path";

const SHARED_DIR = resolve(import.meta.dirname, "../../../shared/packages");
const PACKAGES = [
  "ai", "auth", "db", "firebase-core", "flows",
  "i18n", "legal", "messaging", "payments", "seeders",
];

// Initialize Firebase Admin with application default credentials
initializeApp({ projectId: "plantagoai" });

const db = getFirestore();

async function runTests() {
  console.log("Running tests across shared packages...\n");
  const results = {};
  let totalPass = 0;
  let totalFail = 0;

  for (const pkg of PACKAGES) {
    const pkgDir = join(SHARED_DIR, pkg);
    if (!existsSync(pkgDir)) {
      console.log(`  [skip] ${pkg} — directory not found`);
      continue;
    }

    const start = Date.now();
    try {
      const output = execSync("npx vitest run --reporter=json 2>/dev/null", {
        cwd: pkgDir,
        timeout: 30000,
        encoding: "utf8",
      });

      // Parse JSON output
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const pass = parsed.numPassedTests || 0;
        const fail = parsed.numFailedTests || 0;
        const elapsed = `${((Date.now() - start) / 1000).toFixed(1)}s`;

        results[pkg] = { pass, fail, time: elapsed };
        totalPass += pass;
        totalFail += fail;
        console.log(`  [${fail > 0 ? "FAIL" : " OK "}] ${pkg}: ${pass} passed${fail > 0 ? `, ${fail} failed` : ""} (${elapsed})`);
      } else {
        // Fallback: count from text output
        const passMatch = output.match(/(\d+)\s+passed/);
        const failMatch = output.match(/(\d+)\s+failed/);
        const pass = passMatch ? parseInt(passMatch[1]) : 0;
        const fail = failMatch ? parseInt(failMatch[1]) : 0;
        const elapsed = `${((Date.now() - start) / 1000).toFixed(1)}s`;

        results[pkg] = { pass, fail, time: elapsed };
        totalPass += pass;
        totalFail += fail;
        console.log(`  [${fail > 0 ? "FAIL" : " OK "}] ${pkg}: ${pass} passed${fail > 0 ? `, ${fail} failed` : ""} (${elapsed})`);
      }
    } catch (err) {
      const elapsed = `${((Date.now() - start) / 1000).toFixed(1)}s`;
      // vitest exits non-zero on failures
      const output = err.stdout || err.stderr || "";
      const passMatch = output.match(/(\d+)\s+passed/);
      const failMatch = output.match(/(\d+)\s+failed/);
      const pass = passMatch ? parseInt(passMatch[1]) : 0;
      const fail = failMatch ? parseInt(failMatch[1]) : 1;

      results[pkg] = { pass, fail, time: elapsed };
      totalPass += pass;
      totalFail += fail;
      console.log(`  [FAIL] ${pkg}: ${pass} passed, ${fail} failed (${elapsed})`);
    }
  }

  console.log(`\nTotal: ${totalPass} passed, ${totalFail} failed across ${Object.keys(results).length} packages`);

  // Push to Firestore
  console.log("\nPushing results to Firestore...");
  await db.doc("admin/testResults").set({
    packages: results,
    totalPass,
    totalFail,
    lastRun: new Date().toISOString(),
    packageCount: Object.keys(results).length,
  });

  console.log("Done!");
  process.exit(totalFail > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
