const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const { signToken } = require('../utils/jwt');

exports.signup = asyncHandler(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  
  if (!name || !email || !password || !passwordConfirm) {
    return next(new AppError('Please provide all required fields', 400));
  }
  
  if (password !== passwordConfirm) {
    return next(new AppError('Passwords do not match', 400));
  }

  // Create user (pre save hook will hash password)
  const user = await User.create({ name, email, password });

  // Create token
  const token = signToken(user._id);

  // Remove password before sending
  user.password = undefined;

  res.status(201).json({
    status: 'success',
    token,
    data: { user }
  });
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // need password for comparison, so select it
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  const token = signToken(user._id);

  // Remove password before sending
  user.password = undefined;

  res.status(200).json({
    status: 'success',
    token,
    data: { user }
  });
});

exports.logout = (req, res) => {
  res.status(200).json({ status: 'success', message: 'Logged out successfully' });
};

exports.getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('-password');
  res.status(200).json({ status: 'success', data: { user } });
});

exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, email } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, email },
    { new: true, runValidators: true }
  ).select('-password');

  res.status(200).json({ status: 'success', data: { user } });
});

// Admin: list users
exports.listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  res.status(200).json({ status: 'success', results: users.length, data: { users } });
});
