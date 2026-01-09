import { slugify } from '../utils/slugUtils';

const testCases = [
    { input: "Hello World", expected: "hello-world" },
    { input: "مرحبا بكم", expected: "مرحبا-بكم" },
    { input: "Phone Case غطاء جوال", expected: "phone-case-غطاء-جوال" },
    { input: "Special!@# Characters", expected: "special-characters" },
    { input: "  Trim Me  ", expected: "trim-me" }
];

console.log("Running Slugify Tests...");
let passed = 0;
testCases.forEach(({ input, expected }) => {
    const result = slugify(input);
    if (result === expected) {
        console.log(`✅ PASS: "${input}" -> "${result}"`);
        passed++;
    } else {
        console.error(`❌ FAIL: "${input}" -> "${result}" (Expected: "${expected}")`);
    }
});

if (passed === testCases.length) {
    console.log("\nAll tests passed!");
} else {
    console.error(`\n${testCases.length - passed} tests failed.`);
    process.exit(1);
}
