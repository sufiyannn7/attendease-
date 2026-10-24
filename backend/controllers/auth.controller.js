const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User.model');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name needs at least 2 characters').max(60),
  email: z.string().trim().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password needs at least 8 characters')
    .regex(/[A-Za-z]/, 'Password needs a letter')
    .regex(/\d/, 'Password needs a number'),
  role: z.enum(['teacher', 'student']),
  rollNo: z.string().trim().max(20).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

function sign(user) {
  return jwt.sign({ id: user._id, name: user.name, role: user.role }, env.JWT_SECRET, { expiresIn: '7d' });
}

exports.register = asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0].message, parsed.error.issues);
  const existing = await User.findOne({ email: parsed.data.email });
  if (existing) throw new AppError(409, 'An account with this email already exists');
  const user = await User.create({ ...parsed.data, passwordHash: await bcrypt.hash(parsed.data.password, 12) });
  res.status(201).json({ id: user._id, name: user.name, role: user.role, token: sign(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0].message, parsed.error.issues);
  const user = await User.findOne({ email: parsed.data.email });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    throw new AppError(401, 'Email or password is incorrect');
  }
  res.json({ id: user._id, name: user.name, role: user.role, token: sign(user) });
});

exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  if (!user) throw new AppError(404, 'User not found');
  res.json(user);
});
