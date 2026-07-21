"use strict";

// Independently verify the modified Pascal lattice used by The Great American
// Star. All lattice values are generated from the recurrence; expected values
// appear only in assertions after the calculation is complete.

function fail(message) {
  throw new Error(`MATHEMATICAL CHECK FAILED: ${message}`);
}

function assertEqual(actual, expected, description) {
  if (actual !== expected) {
    fail(`${description}: expected ${expected}, received ${actual}`);
  }
}

function assertArrayEqual(actual, expected, description) {
  if (actual.length !== expected.length) {
    fail(
      `${description}: expected ${expected.length} values, received ${actual.length}`,
    );
  }

  for (let index = 0; index < expected.length; index += 1) {
    if (actual[index] !== expected[index]) {
      fail(
        `${description} at position ${index + 1}: expected ${expected[index]}, received ${actual[index]}`,
      );
    }
  }
}

function widen(previousRow) {
  // The new outside edges each have one parent. Every interior position has
  // the two adjacent parents directly above it.
  const nextRow = [previousRow[0]];

  for (let index = 0; index < previousRow.length - 1; index += 1) {
    nextRow.push(previousRow[index] + previousRow[index + 1]);
  }

  nextRow.push(previousRow[previousRow.length - 1]);
  return nextRow;
}

function narrow(previousRow) {
  // Narrowing removes both outside edges. Each remaining position receives
  // the sum of its two adjacent values in the row directly above.
  const nextRow = [];

  for (let index = 0; index < previousRow.length - 1; index += 1) {
    nextRow.push(previousRow[index] + previousRow[index + 1]);
  }

  return nextRow;
}

function formatRow(row) {
  return row.map((value) => value.toLocaleString("en-US")).join(", ");
}

function verifyPathCount() {
  const rows = [Array(11).fill(1)];

  // Eleven widening transitions produce row lengths 12 through 22.
  for (let transition = 0; transition < 11; transition += 1) {
    rows.push(widen(rows[rows.length - 1]));
  }

  // Twelve narrowing transitions produce row lengths 21 through 10.
  for (let transition = 0; transition < 12; transition += 1) {
    rows.push(narrow(rows[rows.length - 1]));
  }

  const expectedRowLengths = [
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
    21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10,
  ];
  const calculatedRowLengths = rows.map((row) => row.length);

  assertArrayEqual(
    calculatedRowLengths,
    expectedRowLengths,
    "row-length sequence",
  );

  console.log("Modified Pascal lattice row lengths:");
  rows.forEach((row, index) => {
    console.log(`Row ${String(index).padStart(2, "0")}: ${row.length} positions`);
  });

  const expectedTerminalCounts = [
    5_546_358,
    6_690_171,
    7_505_590,
    7_987_049,
    8_198_557,
    8_198_557,
    7_987_049,
    7_505_590,
    6_690_171,
    5_546_358,
  ];
  const terminalCounts = rows[rows.length - 1];

  assertArrayEqual(
    terminalCounts,
    expectedTerminalCounts,
    "terminal path counts",
  );

  console.log("\nFinal ten terminal counts:");
  console.log(formatRow(terminalCounts));

  const pathsPerSection = terminalCounts.reduce(
    (total, value) => total + value,
    0,
  );
  assertEqual(pathsPerSection, 71_855_450, "paths in one section");
  console.log(`\nPaths in one section: ${pathsPerSection.toLocaleString("en-US")}`);

  const sectionCount = 5;
  const completeStarPaths = pathsPerSection * sectionCount;
  assertEqual(
    completeStarPaths,
    359_277_250,
    "paths in the complete five-section star",
  );
  console.log(
    `Complete star: ${pathsPerSection.toLocaleString("en-US")} x ${sectionCount} = ${completeStarPaths.toLocaleString("en-US")}`,
  );

  const startingPositionsPerSection = rows[0].length;
  const startingPointIncidences = sectionCount * startingPositionsPerSection;
  assertEqual(startingPointIncidences, 55, "starting-position incidences");

  const sharedCornerCount = 5;
  const distinctStartingPoints = startingPointIncidences - sharedCornerCount;
  assertEqual(distinctStartingPoints, 50, "distinct starting points");
  console.log(
    `Starting points: ${sectionCount} sections x ${startingPositionsPerSection} incidences - ${sharedCornerCount} shared corners = ${distinctStartingPoints} distinct starting points`,
  );

  console.log("\nALL MATHEMATICAL CHECKS PASSED");
}

try {
  verifyPathCount();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
