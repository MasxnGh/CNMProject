import { levels } from "../src/data/levels.js";
import { validateLevels } from "../src/utils/contentLeakValidator.js";

const result = validateLevels(levels);

console.log("CONTENT VALIDATION");
console.log(`- Total missions: ${result.total}`);
console.log(`- Passed: ${result.passed}`);
console.log(`- Warnings: ${result.warnings}`);
console.log(`- Errors: ${result.errors}`);

for (const mission of result.missions) {
  if (mission.errors.length > 0) {
    console.log(`\n[ERROR] Level ${mission.levelId} / ${mission.missionId}`);
  }
  for (const error of mission.errors) {
    console.log(`${error.code}: ${error.message}${error.field ? ` (${error.field})` : ""}`);
  }
}

if (result.errors > 0) process.exitCode = 1;
