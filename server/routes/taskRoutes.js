import express from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  exportTasksCSV
} from '../controllers/taskController.js';

const router = express.Router();

// CSV Export (must precede parameterized :id routes)
router.get('/export/csv', exportTasksCSV);

// Collection routes
router.route('/')
  .get(getTasks)
  .post(createTask);

// Dedicated Status Transition route
router.put('/:id/status', updateTaskStatus);

// Individual task routes
router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

export default router;
