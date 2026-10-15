# Roots Media Marketing — Employee & Task Management System

A production-ready **MERN Stack** (MongoDB, Express.js, React.js, Node.js) web application built for the **Roots Media Marketing MERN Stack Developer Intern** technical assignment.

This system enables companies to manage employees, assign tasks under strict business rules, monitor capacity limits, track lifecycle transitions, and view real-time company analytics via an interactive dashboard.

---

## 🚀 Live Demo & Deployment Links
* **Frontend Application:** *[Deployed on Render / Vercel / Netlify]*
* **Backend API:** *[Deployed on Render]*

---

## 📌 Architecture & Design Highlights
* **Strict Backend Rule Enforcement:** All business rules (task capacity, employee eligibility, status transitions, leave overlap, deletion safeguards) are strictly validated and enforced on the server.
* **Exact Wireframe Match:** Replicates the provided design references with a dark slate navbar (`#1e222d`), burgundy primary buttons (`#7f3b3b`), compact clean data tables, interactive status dropdowns, and responsive forms with highlighted business-rule error banners.
* **Full Server-Side Search, Filtering & Sorting:** Combines search, multi-department/priority/status filters, due date ranges, and importance-weighted sorting on the server.
* **URL Parameter Synchronization:** Deep linking support where active filters, search queries, and pagination stay in the browser URL (`/tasks?status=In%20Progress&priority=High&page=2`).
* **Filtered CSV Export:** Downloads all tasks matching current search/filter criteria across all pages.
* **Historical Data Integrity:** Safely preserves employee snapshot data on old tasks even if an employee is deleted.

---

## 🛠️ Technology Stack
* **Frontend:** React 18, React Router v6, Lucide React Icons, Modern Vanilla CSS Design Tokens, Vite.
* **Backend:** Node.js (v22), Express.js (v4), Mongoose (v8), CORS, Morgan.
* **Database:** MongoDB (Local or MongoDB Atlas).
* **Testing:** Custom automated integration test runner testing all 20 business rules.

---

## 📂 Project Structure

```
Roots Media Marketing/
├── client/                          # React Frontend Application (Vite)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # ActionMenu, Pagination, Badges
│   │   │   ├── layout/              # Navbar, Header
│   │   │   ├── tasks/               # TaskStatusDropdown, TaskTable
│   │   │   └── employees/           # EmployeeTable
│   │   ├── context/                 # ToastContext (Notifications)
│   │   ├── pages/                   # Dashboard, Tasks, TaskForm, Employees, EmployeeForm
│   │   ├── services/                # API client (Fetch / REST)
│   │   ├── utils/                   # Constants, Date helpers, Status matrices
│   │   ├── App.jsx                  # React Router Configuration
│   │   ├── index.css                # Curated Design System & Aesthetic Tokens
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── server/                          # Node.js + Express API Backend
│   ├── config/                      # MongoDB Connection
│   ├── controllers/                 # Request Handlers (Employee, Task, Dashboard)
│   ├── middleware/                  # Centralized Error Handler
│   ├── models/                      # Mongoose Models (Employee, Task, Counter)
│   ├── routes/                      # Express Routers
│   ├── seed/                        # Realistic Database Seeder
│   ├── services/                    # Core Business Rule Validation Engine
│   ├── tests/                       # Automated Business Rule Test Suite
│   ├── .env.example
│   ├── package.json
│   └── server.js                    # Entrypoint
├── package.json                     # Root orchestrator scripts
├── .gitignore
└── README.md
```

---

## ⚙️ Environment Variables

### Backend (`server/.env.example`)
```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster0.zh5nxfb.mongodb.net/roots-employee-management
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend (`client/.env.example`)
```env
VITE_API_BASE_URL=/api
```

---

## 🏁 Quickstart & Installation

### 1. Prerequisites
* Node.js $\ge$ 18.x (tested on Node v22.14.0)
* MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string.

### 2. Setup Server
```bash
cd server
npm install
cp .env.example .env
npm run seed     # Seeds realistic employees, tasks, and initial metrics
npm test         # Executes 20 automated business rule unit/integration tests
npm start        # Starts server on http://localhost:5000
```

### 3. Setup Client
```bash
cd ../client
npm install --force
cp .env.example .env
npm run dev      # Starts frontend dev server on http://localhost:5173
```

Now open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📑 API Overview

### Employee Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/employees` | Paginated employee list with search, department & status filter, and active task count. |
| `POST` | `/api/employees` | Create employee. Validates unique ID, unique email, and leave dates. |
| `GET` | `/api/employees/:id` | View employee profile with active tasks count and list of assigned tasks. |
| `PUT` | `/api/employees/:id` | Update employee. Validates uniqueness and syncs task snapshots. |
| `DELETE`| `/api/employees/:id` | Deletes employee. **Blocked (400)** if employee holds active tasks. |

### Task Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/tasks` | Paginated tasks with search (title/employee), multi-filter, and priority sorting. |
| `POST` | `/api/tasks` | Create task. Enforces employee eligibility, 3-task capacity, and date rules. |
| `GET` | `/api/tasks/:id` | View task details with employee card, status lifecycle, and overdue flag. |
| `PUT` | `/api/tasks/:id` | Update task details. Rejects editing Completed/Cancelled tasks and rejects status changes. |
| `PUT` | `/api/tasks/:id/status` | **Dedicated status update endpoint.** Enforces valid state machine and sets completed date. |
| `DELETE`| `/api/tasks/:id` | Deletes a task. |
| `GET` | `/api/tasks/export/csv`| Exports all matching filtered tasks across all pages as CSV. |

### Dashboard Analytics Endpoint
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Calculates employee totals, task totals, overdue count, and workload breakdown. |

---

## 🗄️ Database Schemas & Relational Integrity

### Employee Model
* `employeeId` (String, Unique, Uppercase, e.g. `EMP-001`)
* `fullName` (String, Required)
* `email` (String, Unique, Normalized lowercase)
* `phone` (String, Required)
* `department` (Enum: `Development`, `Design`, `QA`, `HR`, `Sales`)
* `role` (String, Required)
* `joiningDate` (Date, Required)
* `status` (Enum: `Active`, `Inactive`, `On Leave`, Default: `Active`)
* `skills` ([String], Min 1 required)
* `leaveStart` (Date, Required if `status === 'On Leave'`)
* `leaveEnd` (Date, Required if `status === 'On Leave'`, must be $\ge$ `leaveStart`)
* `isDeleted` (Boolean, Default `false`)

### Task Model
* `taskId` (String, Auto-generated sequential e.g. `TSK-001`)
* `title` (String, Required, Min 3 characters)
* `description` (String, Required)
* `assignedEmployee` (ObjectId, ref: `Employee`)
* `assignedEmployeeSnapshot` (Embedded Object: `{ fullName, employeeId, email, role, department }`)
* `department` (Enum: `Development`, `Design`, `QA`, `HR`, `Sales`)
* `priority` (Enum: `Low`, `Medium`, `High`, `Critical`, Default: `Medium`)
* `status` (Enum: `Todo`, `In Progress`, `Completed`, `Cancelled`, Default: `Todo`)
* `startDate` (Date, Required)
* `dueDate` (Date, Required, must be $\ge$ `startDate`)
* `completedDate` (Date, null until status transitions to `Completed`)
* Virtual: `isOverdue` (`dueDate < now && !['Completed', 'Cancelled'].includes(status)`)

### Employee Deletion & Historical Integrity
1. **Safety Safeguard:** When a delete request is made (`DELETE /api/employees/:id`), the backend queries the database for any tasks assigned to that employee with status `Todo` or `In Progress`. If any exist, the deletion is immediately rejected with HTTP `400 Bad Request`.
2. **Snapshot Preservation:** If the employee has only `Completed` or `Cancelled` tasks, deletion is permitted. Before deleting, the system ensures the embedded `assignedEmployeeSnapshot` on each historical task document contains the employee's name, ID, and department. Even if the employee document is soft-deleted or removed, past tasks display meaningful attribution and never crash or show blank author cards.

---

## 📝 Answers to Assignment Questions

### 1. Where do you validate status transitions and why?
**Answer:** Status transitions are validated in the **backend service and controller layer** inside the dedicated route `PUT /api/tasks/:id/status`. While the frontend UI restricts the status dropdown options for user convenience, client-side validation can easily be bypassed by API tools (Postman, curl) or modified network payloads. Enforcing the transition state machine (`Todo` $\rightarrow$ `In Progress` $\rightarrow$ `Completed` / `Cancelled`) on the server guarantees data consistency, prevents terminal state modification, and protects the integrity of the business workflow.

### 2. Why does Completed Date come from the backend?
**Answer:** The `completedDate` must be set by the server using `new Date()` at the exact moment a task transitions to `Completed`. Allowing the client to provide or overwrite this date introduces vulnerabilities: users could tamper with their system clocks, forge backdated completion records, or introduce timezone inconsistencies. The server acts as the single source of truth, guaranteeing an auditable and objective completion timestamp.

### 3. How do you block inactive / on-leave assignment?
**Answer:** In the backend `businessRules.js` service called during `createTask` and `updateTask`:
1. The assigned employee document is fetched.
2. If `employee.status === 'Inactive'`, assignment is unconditionally rejected with HTTP 400.
3. If `employee.status === 'On Leave'`, the system converts `employee.leaveStart`, `employee.leaveEnd`, and `task.startDate` to normalized UTC date boundaries. If `leaveStart <= task.startDate <= leaveEnd` (inclusive), the assignment is rejected with HTTP 400 specifying the employee's leave window. If `task.startDate` falls strictly outside the leave window, assignment is permitted.

### 4. Why are filtering and pagination on the backend?
**Answer:** Scalability, network performance, and client memory efficiency. If an organization has tens of thousands of tasks or employees, fetching all records to the browser for in-memory filtering:
1. Causes high latency and large bandwidth consumption over the network.
2. Increases memory overhead and UI freezes on mobile/low-end devices.
3. By offloading filtering, searching (regex/text indexes), and slicing (`skip` & `limit`) to MongoDB, the database query optimizer utilizes indexed fields to return only the requested page of data in milliseconds.

### 5. Why do filters live in the URL?
**Answer:** Deep linking, shareability, and state preservation. By synchronizing search queries, filter selections, sorting orders, and pagination numbers in the browser's URL query string (e.g., `/tasks?status=In%20Progress&priority=High&page=2`):
1. A user can refresh the browser and retain their exact filtered table view without reset.
2. A manager can copy and share the link with another team member to collaborate on the exact same filtered subset of tasks.
3. Browser back/forward navigation operates predictably.

### 6. What can go wrong if two requests assign a 4th active task at the same time?
**Answer:** A **race condition (concurrent write hazard)** occurs:
* Suppose an employee currently has 2 active tasks.
* Request A and Request B arrive almost simultaneously.
* Request A reads the employee's active task count: it reads `2` ($< 3$), so it deems the employee eligible.
* Before Request A writes its task to the database, Request B also reads the employee's active task count: it also reads `2` ($< 3$).
* Both requests pass validation and save their tasks.
* As a result, the employee ends up with **4 active tasks**, violating the business rule.
* **Mitigation:** In high-concurrency environments, this is solved using:
  1. MongoDB multi-document ACID transactions with snapshot isolation.
  2. Maintaining an atomic counter (`activeTaskCount`) on the Employee document using a conditional update: `Employee.findOneAndUpdate({ _id: empId, activeTasks: { $lt: 3 } }, { $inc: { activeTasks: 1 } })`. If the document match fails, the assignment is atomically rejected.

---

## 🧪 Automated Testing Verification

Run the test suite from the `server` directory:
```bash
npm test
```

All 20 test cases pass, validating:
* Inactive employee assignment rejection.
* Exact leave-date boundary tests (start date match, middle of leave, end date match, before leave, after leave).
* Valid status transitions (`Todo` $\rightarrow$ `In Progress` $\rightarrow$ `Completed` / `Cancelled`).
* Invalid status transitions (`Todo` $\rightarrow$ `Completed` skipped, backward transitions, terminal states).
* Max 3 active task capacity limits.
* Employee deletion safeguards.
* Task ID sequential auto-generation (`TSK-001`, `TSK-002`, ...).

---

## 👨‍💻 Submission Details
* **Author:** Shubhangi Mahajan
* **Role:** MERN Stack Developer Intern Applicant
* **Company:** Roots Media Marketing
* **Package:** `Shubhangi_Mahajan.zip`
