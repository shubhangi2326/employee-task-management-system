import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from '../models/Employee.js';
import Task from '../models/Task.js';
import Counter from '../models/Counter.js';

dotenv.config();

const employeesData = [
  {
    employeeId: 'EMP-001',
    fullName: 'Rahul Sharma',
    email: 'rahul.sharma@rootsmedia.com',
    phone: '+91 98765 43210',
    department: 'Development',
    role: 'Senior Full Stack Developer',
    joiningDate: new Date('2023-01-15'),
    status: 'Active',
    skills: ['React', 'Node.js', 'MongoDB', 'Express', 'Docker']
  },
  {
    employeeId: 'EMP-002',
    fullName: 'Priya Patil',
    email: 'priya.patil@rootsmedia.com',
    phone: '+91 98765 43211',
    department: 'Design',
    role: 'Lead UI/UX Designer',
    joiningDate: new Date('2023-03-20'),
    status: 'Active',
    skills: ['Figma', 'Adobe XD', 'Prototyping', 'Design Systems']
  },
  {
    employeeId: 'EMP-003',
    fullName: 'Amit Joshi',
    email: 'amit.joshi@rootsmedia.com',
    phone: '+91 98765 43212',
    department: 'QA',
    role: 'Senior QA Automation Engineer',
    joiningDate: new Date('2023-05-10'),
    status: 'Active',
    skills: ['Selenium', 'Cypress', 'Jest', 'Postman', 'API Testing']
  },
  {
    employeeId: 'EMP-004',
    fullName: 'Sneha Deshmukh',
    email: 'sneha.deshmukh@rootsmedia.com',
    phone: '+91 98765 43213',
    department: 'Development',
    role: 'Backend Developer',
    joiningDate: new Date('2023-07-01'),
    status: 'Active',
    skills: ['Node.js', 'Python', 'PostgreSQL', 'Redis']
  },
  {
    employeeId: 'EMP-005',
    fullName: 'Rohan Kulkarni',
    email: 'rohan.kulkarni@rootsmedia.com',
    phone: '+91 98765 43214',
    department: 'Sales',
    role: 'Sales Strategist',
    joiningDate: new Date('2023-08-15'),
    status: 'Active',
    skills: ['B2B Sales', 'CRM', 'Lead Generation', 'Client Relations']
  },
  {
    employeeId: 'EMP-006',
    fullName: 'Ananya Roy',
    email: 'ananya.roy@rootsmedia.com',
    phone: '+91 98765 43215',
    department: 'HR',
    role: 'HR Executive',
    joiningDate: new Date('2023-09-01'),
    status: 'Active',
    skills: ['Talent Acquisition', 'Employee Relations', 'Payroll']
  },
  {
    employeeId: 'EMP-007',
    fullName: 'Vikram Mehta',
    email: 'vikram.mehta@rootsmedia.com',
    phone: '+91 98765 43216',
    department: 'Development',
    role: 'DevOps Specialist',
    joiningDate: new Date('2023-11-15'),
    status: 'Active',
    skills: ['AWS', 'Kubernetes', 'CI/CD', 'Terraform']
  },
  {
    employeeId: 'EMP-008',
    fullName: 'Pooja Nair',
    email: 'pooja.nair@rootsmedia.com',
    phone: '+91 98765 43217',
    department: 'Design',
    role: 'Visual Designer',
    joiningDate: new Date('2024-01-10'),
    status: 'Active',
    skills: ['Illustrator', 'Motion Design', 'Brand Identity']
  },
  {
    employeeId: 'EMP-009',
    fullName: 'Suresh Raina',
    email: 'suresh.raina@rootsmedia.com',
    phone: '+91 98765 43218',
    department: 'Sales',
    role: 'Account Executive',
    joiningDate: new Date('2022-06-01'),
    status: 'Inactive',
    skills: ['Client Outreach', 'Negotiation']
  },
  {
    employeeId: 'EMP-010',
    fullName: 'Kavita Verma',
    email: 'kavita.verma@rootsmedia.com',
    phone: '+91 98765 43219',
    department: 'QA',
    role: 'Junior Manual Tester',
    joiningDate: new Date('2024-02-01'),
    status: 'Inactive',
    skills: ['Manual Testing', 'Bug Reporting', 'JIRA']
  },
  {
    employeeId: 'EMP-011',
    fullName: 'Deepak Chopra',
    email: 'deepak.chopra@rootsmedia.com',
    phone: '+91 98765 43220',
    department: 'Development',
    role: 'Frontend Developer',
    joiningDate: new Date('2023-04-12'),
    status: 'On Leave',
    skills: ['Vue.js', 'Tailwind', 'TypeScript'],
    leaveStart: new Date('2026-10-10'),
    leaveEnd: new Date('2026-10-25')
  },
  {
    employeeId: 'EMP-012',
    fullName: 'Meera Iyer',
    email: 'meera.iyer@rootsmedia.com',
    phone: '+91 98765 43221',
    department: 'HR',
    role: 'Recruiting Lead',
    joiningDate: new Date('2022-09-15'),
    status: 'On Leave',
    skills: ['Headhunting', 'Screening', 'Onboarding'],
    leaveStart: new Date('2026-10-01'),
    leaveEnd: new Date('2026-10-20')
  }
];

export const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/roots-employee-management';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing collections
    await Employee.deleteMany({});
    await Task.deleteMany({});
    await Counter.deleteMany({});

    console.log('Cleared existing data.');

    // Initialize Counter for Task ID
    await Counter.create({ _id: 'taskId', seq: 40 });

    // Insert Employees
    const createdEmployees = await Employee.insertMany(employeesData);
    console.log(`Seeded ${createdEmployees.length} employees.`);

    const empMap = {};
    createdEmployees.forEach(emp => {
      empMap[emp.fullName] = emp;
    });

    const rahul = empMap['Rahul Sharma'];
    const priya = empMap['Priya Patil'];
    const amit = empMap['Amit Joshi'];
    const sneha = empMap['Sneha Deshmukh'];
    const rohan = empMap['Rohan Kulkarni'];
    const ananya = empMap['Ananya Roy'];
    const vikram = empMap['Vikram Mehta'];
    const pooja = empMap['Pooja Nair'];

    // Realistic tasks corresponding to reference wireframes and dashboard metrics
    // Rahul: 3 active tasks (TSK-001, TSK-005, TSK-006)
    // Priya: 2 active tasks (TSK-007, TSK-008) + cancelled tasks
    // Amit: 1 active task (TSK-009) + completed tasks
    const tasksData = [
      {
        taskId: 'TSK-001',
        title: 'Fix payment API bug',
        description: 'Resolve issue with Stripe webhook signature validation failing intermittently on checkout.',
        assignedEmployee: rahul._id,
        assignedEmployeeSnapshot: {
          fullName: rahul.fullName,
          employeeId: rahul.employeeId,
          email: rahul.email,
          role: rahul.role,
          department: rahul.department
        },
        department: 'Development',
        priority: 'High',
        status: 'In Progress',
        startDate: new Date('2026-09-25'),
        dueDate: new Date('2026-10-05'), // Overdue
        completedDate: null
      },
      {
        taskId: 'TSK-002',
        title: 'Design login screen',
        description: 'Create high-fidelity responsive wireframes and micro-interactions for modern sign-in screen.',
        assignedEmployee: priya._id,
        assignedEmployeeSnapshot: {
          fullName: priya.fullName,
          employeeId: priya.employeeId,
          email: priya.email,
          role: priya.role,
          department: priya.department
        },
        department: 'Design',
        priority: 'Medium',
        status: 'Cancelled',
        startDate: new Date('2026-09-28'),
        dueDate: new Date('2026-10-20'),
        completedDate: null
      },
      {
        taskId: 'TSK-003',
        title: 'Write test cases',
        description: 'Develop comprehensive integration tests for Employee CRUD and Task status transitions.',
        assignedEmployee: amit._id,
        assignedEmployeeSnapshot: {
          fullName: amit.fullName,
          employeeId: amit.employeeId,
          email: amit.email,
          role: amit.role,
          department: amit.department
        },
        department: 'QA',
        priority: 'Low',
        status: 'Completed',
        startDate: new Date('2026-09-15'),
        dueDate: new Date('2026-10-02'),
        completedDate: new Date('2026-10-01')
      },
      {
        taskId: 'TSK-004',
        title: 'Update landing page',
        description: 'Refresh hero copy and replace product feature graphics to align with Q4 campaign.',
        assignedEmployee: priya._id,
        assignedEmployeeSnapshot: {
          fullName: priya.fullName,
          employeeId: priya.employeeId,
          email: priya.email,
          role: priya.role,
          department: priya.department
        },
        department: 'Design',
        priority: 'Critical',
        status: 'Cancelled',
        startDate: new Date('2026-10-01'),
        dueDate: new Date('2026-10-12'),
        completedDate: null
      },
      {
        taskId: 'TSK-005',
        title: 'Setup CI pipeline',
        description: 'Configure GitHub Actions workflow for linting, testing, and automated Render/Vercel deployment.',
        assignedEmployee: rahul._id,
        assignedEmployeeSnapshot: {
          fullName: rahul.fullName,
          employeeId: rahul.employeeId,
          email: rahul.email,
          role: rahul.role,
          department: rahul.department
        },
        department: 'Development',
        priority: 'High',
        status: 'Todo',
        startDate: new Date('2026-10-10'),
        dueDate: new Date('2026-10-25'),
        completedDate: null
      },
      {
        taskId: 'TSK-006',
        title: 'Optimize database indexes',
        description: 'Add compound indexes on tasks collection for search queries and due date range filters.',
        assignedEmployee: rahul._id,
        assignedEmployeeSnapshot: {
          fullName: rahul.fullName,
          employeeId: rahul.employeeId,
          email: rahul.email,
          role: rahul.role,
          department: rahul.department
        },
        department: 'Development',
        priority: 'Medium',
        status: 'In Progress',
        startDate: new Date('2026-10-02'),
        dueDate: new Date('2026-10-08'), // Overdue
        completedDate: null
      },
      {
        taskId: 'TSK-007',
        title: 'Audit accessibility colors',
        description: 'Ensure color contrast meets WCAG AAA standards across all dashboard chart widgets and badges.',
        assignedEmployee: priya._id,
        assignedEmployeeSnapshot: {
          fullName: priya.fullName,
          employeeId: priya.employeeId,
          email: priya.email,
          role: priya.role,
          department: priya.department
        },
        department: 'Design',
        priority: 'High',
        status: 'In Progress',
        startDate: new Date('2026-10-05'),
        dueDate: new Date('2026-10-28'),
        completedDate: null
      },
      {
        taskId: 'TSK-008',
        title: 'Mobile navigation revamp',
        description: 'Create slide-out mobile drawer navigation with quick filter shortcuts for on-the-go managers.',
        assignedEmployee: priya._id,
        assignedEmployeeSnapshot: {
          fullName: priya.fullName,
          employeeId: priya.employeeId,
          email: priya.email,
          role: priya.role,
          department: priya.department
        },
        department: 'Design',
        priority: 'Critical',
        status: 'Todo',
        startDate: new Date('2026-10-12'),
        dueDate: new Date('2026-10-30'),
        completedDate: null
      },
      {
        taskId: 'TSK-009',
        title: 'Automate regression suite',
        description: 'Implement automated Cypress end-to-end tests covering employee deletion safeguards and task capacity checks.',
        assignedEmployee: amit._id,
        assignedEmployeeSnapshot: {
          fullName: amit.fullName,
          employeeId: amit.employeeId,
          email: amit.email,
          role: amit.role,
          department: amit.department
        },
        department: 'QA',
        priority: 'High',
        status: 'In Progress',
        startDate: new Date('2026-10-01'),
        dueDate: new Date('2026-10-07'), // Overdue
        completedDate: null
      },
      {
        taskId: 'TSK-010',
        title: 'Q4 Pitch deck presentation',
        description: 'Prepare data-backed deck outlining our digital marketing growth targets for upcoming corporate clients.',
        assignedEmployee: rohan._id,
        assignedEmployeeSnapshot: {
          fullName: rohan.fullName,
          employeeId: rohan.employeeId,
          email: rohan.email,
          role: rohan.role,
          department: rohan.department
        },
        department: 'Sales',
        priority: 'Medium',
        status: 'Todo',
        startDate: new Date('2026-10-08'),
        dueDate: new Date('2026-10-22'),
        completedDate: null
      },
      {
        taskId: 'TSK-011',
        title: 'Onboarding packet documentation',
        description: 'Compile new hire security policies, code review standards, and PTO request guidelines.',
        assignedEmployee: ananya._id,
        assignedEmployeeSnapshot: {
          fullName: ananya.fullName,
          employeeId: ananya.employeeId,
          email: ananya.email,
          role: ananya.role,
          department: ananya.department
        },
        department: 'HR',
        priority: 'Low',
        status: 'Todo',
        startDate: new Date('2026-10-03'),
        dueDate: new Date('2026-10-18'),
        completedDate: null
      },
      {
        taskId: 'TSK-012',
        title: 'Kubernetes cluster security hardening',
        description: 'Implement network policies, pod security admission controllers, and secret rotation.',
        assignedEmployee: vikram._id,
        assignedEmployeeSnapshot: {
          fullName: vikram.fullName,
          employeeId: vikram.employeeId,
          email: vikram.email,
          role: vikram.role,
          department: vikram.department
        },
        department: 'Development',
        priority: 'Critical',
        status: 'In Progress',
        startDate: new Date('2026-09-20'),
        dueDate: new Date('2026-10-04'), // Overdue
        completedDate: null
      },
      {
        taskId: 'TSK-013',
        title: 'Brand icon pack generation',
        description: 'Vectorize 40 custom SVG icons representing marketing deliverables and campaign analytics.',
        assignedEmployee: pooja._id,
        assignedEmployeeSnapshot: {
          fullName: pooja.fullName,
          employeeId: pooja.employeeId,
          email: pooja.email,
          role: pooja.role,
          department: pooja.department
        },
        department: 'Design',
        priority: 'Low',
        status: 'Todo',
        startDate: new Date('2026-10-09'),
        dueDate: new Date('2026-10-24'),
        completedDate: null
      },
      {
        taskId: 'TSK-014',
        title: 'Review CRM integrations',
        description: 'Evaluate HubSpot webhook reliability and synchronize custom fields with lead scoring engine.',
        assignedEmployee: rohan._id,
        assignedEmployeeSnapshot: {
          fullName: rohan.fullName,
          employeeId: rohan.employeeId,
          email: rohan.email,
          role: rohan.role,
          department: rohan.department
        },
        department: 'Sales',
        priority: 'High',
        status: 'In Progress',
        startDate: new Date('2026-09-18'),
        dueDate: new Date('2026-10-06'), // Overdue
        completedDate: null
      },
      {
        taskId: 'TSK-015',
        title: 'API Rate Limiting implementation',
        description: 'Enforce Redis token-bucket rate limiter across public routes to prevent abuse.',
        assignedEmployee: sneha._id,
        assignedEmployeeSnapshot: {
          fullName: sneha.fullName,
          employeeId: sneha.employeeId,
          email: sneha.email,
          role: sneha.role,
          department: sneha.department
        },
        department: 'Development',
        priority: 'High',
        status: 'Completed',
        startDate: new Date('2026-09-10'),
        dueDate: new Date('2026-09-28'),
        completedDate: new Date('2026-09-27')
      }
    ];

    await Task.insertMany(tasksData);
    console.log(`Seeded ${tasksData.length} initial tasks.`);

    console.log('Database seeding finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run if called directly
seedDatabase();
