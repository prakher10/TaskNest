const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project must have a creator'],
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      // Ensure all _id fields are serialized as plain strings
      transform: (_doc, ret) => {
        ret._id = ret._id?.toString();
        if (ret.createdBy && typeof ret.createdBy === 'object') {
          ret.createdBy._id = ret.createdBy._id?.toString();
        }
        if (Array.isArray(ret.members)) {
          ret.members = ret.members.map((m) =>
            typeof m === 'object' ? { ...m, _id: m._id?.toString() } : m
          );
        }
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
projectSchema.index({ createdBy: 1 });
projectSchema.index({ members: 1 });
// Text index for search
projectSchema.index({ title: 'text', description: 'text' });

// ─── Virtual: membersCount ────────────────────────────────────────────────────
projectSchema.virtual('membersCount').get(function () {
  return this.members ? this.members.length : 0;
});

// ─── Instance: check if a user is a member or creator ────────────────────────
projectSchema.methods.hasAccess = function (userId) {
  const id = userId.toString();

  // createdBy can be either a raw ObjectId or a populated User document
  const creatorId =
    this.createdBy && typeof this.createdBy === 'object' && this.createdBy._id
      ? this.createdBy._id.toString()
      : this.createdBy
      ? this.createdBy.toString()
      : '';

  if (creatorId === id) return true;

  // members array can contain raw ObjectIds or populated User documents
  return this.members.some((m) => {
    const memberId =
      m && typeof m === 'object' && m._id
        ? m._id.toString()
        : m
        ? m.toString()
        : '';
    return memberId === id;
  });
};

module.exports = mongoose.model('Project', projectSchema);
