import mongoose from 'mongoose';
import { DEPARTMENTS } from './Employee.js';

export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const TASK_STATUSES = ['Todo', 'In Progress', 'Completed', 'Cancelled'];

const taskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      unique: true,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Task title must be at least 3 characters']
    },
    description: {
      type: String,
      required: [true, 'Task description is required'],
      trim: true
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Assigned employee is required']
    },
    assignedEmployeeSnapshot: {
      fullName: { type: String, default: '' },
      employeeId: { type: String, default: '' },
      email: { type: String, default: '' },
      role: { type: String, default: '' },
      department: { type: String, default: '' }
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: {
        values: DEPARTMENTS,
        message: '{VALUE} is not a valid department'
      }
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: {
        values: TASK_PRIORITIES,
        message: '{VALUE} is not a valid priority'
      },
      default: 'Medium'
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: TASK_STATUSES,
        message: '{VALUE} is not a valid status'
      },
      default: 'Todo'
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      validate: {
        validator: function (v) {
          if (!this.startDate) return true;
          return v >= this.startDate;
        },
        message: 'Due date cannot be earlier than start date'
      }
    },
    completedDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for overdue
taskSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate) return false;
  const isTerminal = this.status === 'Completed' || this.status === 'Cancelled';
  if (isTerminal) return false;
  return new Date() > new Date(this.dueDate);
});

// Indexes
taskSchema.index({ title: 'text' });
taskSchema.index({ assignedEmployee: 1, status: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ department: 1 });
taskSchema.index({ priority: 1 });

const Task = mongoose.model('Task', taskSchema);
export default Task;
