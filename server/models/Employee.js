import mongoose from 'mongoose';

export const DEPARTMENTS = ['Development', 'Design', 'QA', 'HR', 'Sales'];
export const EMPLOYEE_STATUSES = ['Active', 'Inactive', 'On Leave'];

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: {
        values: DEPARTMENTS,
        message: '{VALUE} is not a valid department'
      }
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required']
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: EMPLOYEE_STATUSES,
        message: '{VALUE} is not a valid status'
      },
      default: 'Active'
    },
    skills: {
      type: [String],
      required: [true, 'At least one skill is required'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one skill must be specified'
      }
    },
    leaveStart: {
      type: Date,
      default: null,
      validate: {
        validator: function (v) {
          if (this.status === 'On Leave') {
            return v != null;
          }
          return true;
        },
        message: 'Leave start date is required when employee is On Leave'
      }
    },
    leaveEnd: {
      type: Date,
      default: null,
      validate: {
        validator: function (v) {
          if (this.status === 'On Leave') {
            return v != null && (!this.leaveStart || v >= this.leaveStart);
          }
          return true;
        },
        message: 'Leave end date is required when employee is On Leave and must be on or after leave start date'
      }
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
employeeSchema.index({ fullName: 'text', email: 'text', role: 'text' });

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
