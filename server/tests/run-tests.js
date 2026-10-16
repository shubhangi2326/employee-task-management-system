import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from '../models/Employee.js';
import Task from '../models/Task.js';
import Counter from '../models/Counter.js';
import {
  validateEmployeeEligibility,
  validateEmployeeCapacity,
  validateStatusTransition,
  validateEmployeeDeletion
} from '../services/businessRules.js';
import {
  generateTaskId,
  buildTaskFilterQuery,
  formatDateYYYYMMDD,
  formatDateForCSV,
  escapeCSV,
  exportTasksCSV
} from '../controllers/taskController.js';

dotenv.config();

const runAllTests = async () => {
  let passed = 0;
  let failed = 0;

  const assert = (condition, description) => {
    if (condition) {
      console.log(`  ✓ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${description}`);
      failed++;
    }
  };

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/roots-employee-management';
    await mongoose.connect(mongoUri);
    console.log('\n========================================');
    console.log('🧪 RUNNING ROOTS MEDIA BUSINESS RULE TESTS');
    console.log('========================================\n');

    // Clean up temporary test data
    await Employee.deleteMany({ employeeId: /^TEST-/ });
    await Task.deleteMany({ title: /^\[TEST\]/ });

    // ----------------------------------------------------
    // TEST SUITE 1: Task Assignment & Employee Status Rules
    // ----------------------------------------------------
    console.log('--- 1. Testing Employee Eligibility for Task Assignment ---');

    // 1.1 Inactive employee must always be rejected
    const inactiveEmp = new Employee({
      employeeId: 'TEST-INACT',
      fullName: 'Test Inactive',
      email: 'inactive@test.com',
      phone: '1234567890',
      department: 'Development',
      role: 'Developer',
      joiningDate: new Date(),
      status: 'Inactive',
      skills: ['Node.js']
    });
    const inactiveCheck = validateEmployeeEligibility(inactiveEmp, new Date());
    assert(inactiveCheck.valid === false && inactiveCheck.message.includes('Inactive'),
      'Task assignment to Inactive employee is rejected');

    // 1.2 On Leave employee: rejected ONLY if startDate falls inside leave period (inclusive)
    const onLeaveEmp = new Employee({
      employeeId: 'TEST-LEAVE',
      fullName: 'Test OnLeave',
      email: 'onleave@test.com',
      phone: '1234567890',
      department: 'Design',
      role: 'Designer',
      joiningDate: new Date(),
      status: 'On Leave',
      skills: ['Figma'],
      leaveStart: new Date('2026-10-10'),
      leaveEnd: new Date('2026-10-20')
    });

    // Start date inside leave window (inclusive)
    const insideCheckStart = validateEmployeeEligibility(onLeaveEmp, new Date('2026-10-10'));
    assert(insideCheckStart.valid === false && insideCheckStart.message.includes('On Leave'),
      'Task assignment rejected when startDate matches leaveStart exactly (inclusive)');

    const insideCheckMid = validateEmployeeEligibility(onLeaveEmp, new Date('2026-10-15'));
    assert(insideCheckMid.valid === false && insideCheckMid.message.includes('On Leave'),
      'Task assignment rejected when startDate is in the middle of leave period');

    const insideCheckEnd = validateEmployeeEligibility(onLeaveEmp, new Date('2026-10-20'));
    assert(insideCheckEnd.valid === false && insideCheckEnd.message.includes('On Leave'),
      'Task assignment rejected when startDate matches leaveEnd exactly (inclusive)');

    // Start date outside leave window
    const outsideBefore = validateEmployeeEligibility(onLeaveEmp, new Date('2026-10-09'));
    assert(outsideBefore.valid === true,
      'Task assignment PERMITTED when startDate is before leave window');

    const outsideAfter = validateEmployeeEligibility(onLeaveEmp, new Date('2026-10-21'));
    assert(outsideAfter.valid === true,
      'Task assignment PERMITTED when startDate is after leave window');

    // 1.3 Active employee is permitted
    const activeEmp = new Employee({
      employeeId: 'TEST-ACT',
      fullName: 'Test Active',
      email: 'active@test.com',
      phone: '1234567890',
      department: 'QA',
      role: 'QA Engineer',
      joiningDate: new Date(),
      status: 'Active',
      skills: ['Cypress']
    });
    const activeCheck = validateEmployeeEligibility(activeEmp, new Date());
    assert(activeCheck.valid === true,
      'Task assignment PERMITTED for Active employee');

    // ----------------------------------------------------
    // TEST SUITE 2: Status Transition State Machine Rules
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Status Transition Lifecycle ---');

    // Allowed transitions
    assert(validateStatusTransition('Todo', 'In Progress').valid === true,
      'Todo -> In Progress transition is allowed');
    assert(validateStatusTransition('In Progress', 'Completed').valid === true,
      'In Progress -> Completed transition is allowed');
    assert(validateStatusTransition('Todo', 'Cancelled').valid === true,
      'Todo -> Cancelled transition is allowed');
    assert(validateStatusTransition('In Progress', 'Cancelled').valid === true,
      'In Progress -> Cancelled transition is allowed');

    // Prohibited transitions
    assert(validateStatusTransition('Todo', 'Completed').valid === false,
      'Direct Todo -> Completed is rejected (must go via In Progress)');
    assert(validateStatusTransition('In Progress', 'Todo').valid === false,
      'Backward In Progress -> Todo is rejected');
    assert(validateStatusTransition('Completed', 'In Progress').valid === false,
      'Transition out of Completed (terminal) is rejected');
    assert(validateStatusTransition('Cancelled', 'Todo').valid === false,
      'Transition out of Cancelled (terminal) is rejected');

    // ----------------------------------------------------
    // TEST SUITE 3: Employee Capacity Limits (Max 3 Active Tasks)
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Capacity Limits (Max 3 Active Tasks) ---');

    await activeEmp.save();

    // Create 3 active tasks for activeEmp
    const t1 = await Task.create({
      taskId: 'TEST-001',
      title: '[TEST] Task 1',
      description: 'Test task 1',
      assignedEmployee: activeEmp._id,
      department: 'QA',
      priority: 'Low',
      status: 'Todo',
      startDate: new Date('2026-10-01'),
      dueDate: new Date('2026-10-10')
    });

    const t2 = await Task.create({
      taskId: 'TEST-002',
      title: '[TEST] Task 2',
      description: 'Test task 2',
      assignedEmployee: activeEmp._id,
      department: 'QA',
      priority: 'Medium',
      status: 'In Progress',
      startDate: new Date('2026-10-01'),
      dueDate: new Date('2026-10-10')
    });

    const t3 = await Task.create({
      taskId: 'TEST-003',
      title: '[TEST] Task 3',
      description: 'Test task 3',
      assignedEmployee: activeEmp._id,
      department: 'QA',
      priority: 'High',
      status: 'Todo',
      startDate: new Date('2026-10-01'),
      dueDate: new Date('2026-10-10')
    });

    // Capacity check with 3 active tasks
    const capacityFull = await validateEmployeeCapacity(activeEmp._id);
    assert(capacityFull.valid === false && capacityFull.message.includes('3 active tasks'),
      'Assigning a 4th active task is rejected when employee already has 3 active tasks');

    // If one task is completed, employee has 2 active tasks -> allowed
    t3.status = 'Completed';
    await t3.save();

    const capacityAvailable = await validateEmployeeCapacity(activeEmp._id);
    assert(capacityAvailable.valid === true && capacityAvailable.activeCount === 2,
      'Assigning a 3rd active task is allowed after an active task is Completed');

    // ----------------------------------------------------
    // TEST SUITE 4: Employee Deletion Safeguards
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Employee Deletion Safeguards ---');

    // activeEmp has 2 active tasks (t1, t2)
    const deletionBlocked = await validateEmployeeDeletion(activeEmp._id);
    assert(deletionBlocked.valid === false && deletionBlocked.message.includes('active task'),
      'Deleting an employee with active tasks (Todo / In Progress) is rejected');

    // Mark remaining tasks as Completed / Cancelled
    t1.status = 'Completed';
    await t1.save();
    t2.status = 'Cancelled';
    await t2.save();

    const deletionAllowed = await validateEmployeeDeletion(activeEmp._id);
    assert(deletionAllowed.valid === true,
      'Deleting an employee is allowed when all assigned tasks are Completed or Cancelled');

    // ----------------------------------------------------
    // TEST SUITE 5: Task ID Generation Format
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Task ID Sequence Generation ---');
    const newTaskId = await generateTaskId();
    assert(/^TSK-\d{3,}$/.test(newTaskId),
      `Generated task ID matches format TSK-000 (${newTaskId})`);

    // ----------------------------------------------------
    // TEST SUITE 6: CSV Export & Date Formatting
    // ----------------------------------------------------
    console.log('\n--- 6. Testing CSV Export & Date Formatting ---');

    // 6.1 formatDateYYYYMMDD unit tests
    assert(formatDateYYYYMMDD(new Date('2026-10-15T00:00:00.000Z')) === '2026-10-15',
      'formatDateYYYYMMDD formats Date object as YYYY-MM-DD');
    assert(formatDateYYYYMMDD('2026-09-25') === '2026-09-25',
      'formatDateYYYYMMDD preserves valid ISO string as YYYY-MM-DD');
    assert(formatDateYYYYMMDD(null) === '',
      'formatDateYYYYMMDD returns empty string for null');
    assert(formatDateYYYYMMDD(undefined) === '',
      'formatDateYYYYMMDD returns empty string for undefined');
    assert(formatDateYYYYMMDD('') === '',
      'formatDateYYYYMMDD returns empty string for empty string');
    assert(formatDateYYYYMMDD('invalid-date') === '',
      'formatDateYYYYMMDD returns empty string for invalid date');
    assert(formatDateYYYYMMDD('########') === '',
      'formatDateYYYYMMDD returns empty string for ######## string');
    assert(formatDateYYYYMMDD('Invalid Date') === '',
      'formatDateYYYYMMDD returns empty string for Invalid Date string');

    // 6.2 formatDateForCSV unit tests
    assert(formatDateForCSV('2026-09-25') === '="2026-09-25"',
      'formatDateForCSV formats valid date as Excel text formula ="YYYY-MM-DD"');
    assert(formatDateForCSV(null) === '',
      'formatDateForCSV returns empty string for null');
    assert(formatDateForCSV(undefined) === '',
      'formatDateForCSV returns empty string for undefined');

    // 6.3 escapeCSV unit tests
    assert(escapeCSV(null) === '',
      'escapeCSV returns empty string for null');
    assert(escapeCSV(undefined) === '',
      'escapeCSV returns empty string for undefined');
    assert(escapeCSV('') === '',
      'escapeCSV returns empty string for empty string');
    assert(escapeCSV('="2026-09-25"') === '="2026-09-25"',
      'escapeCSV passes through Excel text formula ="YYYY-MM-DD"');
    assert(escapeCSV('Test "Quote"') === '"Test ""Quote"""',
      'escapeCSV escapes double quotes correctly');

    // 6.4 exportTasksCSV integration test
    let exportedHeaders = {};
    let exportedStatus = 0;
    let exportedData = '';

    const mockReq = { query: {} };
    const mockRes = {
      setHeader: (name, val) => { exportedHeaders[name.toLowerCase()] = val; },
      status: (code) => {
        exportedStatus = code;
        return {
          send: (content) => { exportedData = content; }
        };
      }
    };

    await exportTasksCSV(mockReq, mockRes, (err) => {
      if (err) throw err;
    });

    assert(exportedStatus === 200, 'CSV export returns HTTP 200');
    assert(exportedHeaders['content-type'] && exportedHeaders['content-type'].includes('text/csv'),
      'CSV export returns Content-Type text/csv');
    assert(exportedHeaders['content-disposition'] && exportedHeaders['content-disposition'].includes('.csv'),
      'CSV export sets attachment filename header');

    const csvLines = exportedData.split('\r\n').filter(Boolean);
    const expectedHeader = 'Task ID,Title,Description,Assigned Employee,Employee ID,Department,Priority,Status,Start Date,Due Date,Completed Date,Overdue';
    assert(csvLines[0] === expectedHeader,
      'CSV header matches expected columns');

    // Helper to parse a CSV line with quotes
    const parseCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    };

    const cleanDate = (d) => (d ? d.replace(/^=?"?|"?$/g, '') : '');

    let allStartDatesValid = true;
    let allDueDatesValid = true;
    let allCompletedDatesValid = true;
    let dataRowCount = 0;

    for (let i = 1; i < csvLines.length; i++) {
      const fields = parseCSVLine(csvLines[i]);
      if (fields.length < 12) continue;
      dataRowCount++;
      const [taskId, title, desc, empName, empId, dept, priority, status, startDate, dueDate, compDate, overdue] = fields;

      const cleanStart = cleanDate(startDate);
      const cleanDue = cleanDate(dueDate);
      const cleanComp = cleanDate(compDate);

      // Start Date must be YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanStart)) {
        allStartDatesValid = false;
        console.error(`Invalid Start Date in row ${i} (${taskId}): "${startDate}"`);
      }

      // Due Date must be YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDue)) {
        allDueDatesValid = false;
        console.error(`Invalid Due Date in row ${i} (${taskId}): "${dueDate}"`);
      }

      // Completed Date: must be YYYY-MM-DD if present, otherwise empty string ''
      // It must NEVER be '########', 'Invalid Date', or 'undefined'
      if (compDate !== '') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanComp)) {
          allCompletedDatesValid = false;
          console.error(`Invalid Completed Date in row ${i} (${taskId}): "${compDate}"`);
        }
      } else {
        if (compDate === '########' || compDate === 'Invalid Date' || compDate === 'undefined') {
          allCompletedDatesValid = false;
          console.error(`Corrupted Completed Date placeholder in row ${i} (${taskId}): "${compDate}"`);
        }
      }
    }

    assert(dataRowCount > 0, `CSV export contains data rows (found ${dataRowCount})`);
    assert(allStartDatesValid, 'All exported Start Dates are strictly in YYYY-MM-DD format');
    assert(allDueDatesValid, 'All exported Due Dates are strictly in YYYY-MM-DD format');
    assert(allCompletedDatesValid, 'Completed Dates are YYYY-MM-DD when completed, and clean empty values when missing');

    // Clean up test records
    await Employee.deleteMany({ employeeId: /^TEST-/ });
    await Task.deleteMany({ title: /^\[TEST\]/ });

    console.log('\n========================================');
    console.log(`📊 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('========================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
};

runAllTests();
