import { shuffleArray } from '../utils/arrayUtils';

const testArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const shuffled = shuffleArray([...testArray]);

console.log('Original:', testArray);
console.log('Shuffled:', shuffled);

if (testArray.length !== shuffled.length) {
    console.error('❌ FAIL: Length mismatch');
    process.exit(1);
}

const isDifferent = testArray.some((val, idx) => val !== shuffled[idx]);
if (isDifferent) {
    console.log('✅ PASS: Array was shuffled');
} else {
    console.warn('⚠️ WARNING: Array order is identical (could happen by chance but unlikely for size 10)');
}
