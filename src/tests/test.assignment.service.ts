// src/tests/test.assignment.service.ts
import 'dotenv/config';
import { assignmentService } from '../services/assignment.service';

async function main() {
  console.log('===========================================');
  console.log('TEST 1: PM yang benar');
  console.log('===========================================');
  const test1 = await assignmentService.processAssignment(
    'AFC-001/1.1.1',
    '608799743',
  );
  console.log('Result:', JSON.stringify(test1, null, 2));

  console.log('\n===========================================');
  console.log('TEST 2: Bukan PM (telegram ID salah)');
  console.log('===========================================');
  const test2 = await assignmentService.processAssignment(
    'AFC-001/1.1.2',
    '999999999',
  );
  console.log('Result:', JSON.stringify(test2, null, 2));

  console.log('\n===========================================');
  console.log('TEST 3: WP ID tidak ada');
  console.log('===========================================');
  const test3 = await assignmentService.processAssignment(
    'AFC-999/9.9.9',
    '608799743',
  );
  console.log('Result:', JSON.stringify(test3, null, 2));

  console.log('\n===========================================');
  console.log('TEST 4: WP yang sudah di-assign (AFC-001/1.1.1)');
  console.log('===========================================');
  const test4 = await assignmentService.processAssignment(
    'AFC-001/1.1.1',
    '608799743',
  );
  console.log('Result:', JSON.stringify(test4, null, 2));
}

main().catch(console.error);
