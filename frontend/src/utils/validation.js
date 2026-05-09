import { CHALLENGE_DIFFICULTIES, CHALLENGE_CATEGORIES } from './constants';

// Challenge validation
export const validateChallenge = (challenge) => {
  const errors = {};

  if (!challenge.title?.trim()) {
    errors.title = 'Title is required';
  } else if (challenge.title.length < 3) {
    errors.title = 'Title must be at least 3 characters';
  }

  if (!challenge.description?.trim()) {
    errors.description = 'Description is required';
  }

  if (!challenge.category) {
    errors.category = 'Category is required';
  } else if (!Object.values(CHALLENGE_CATEGORIES).includes(challenge.category)) {
    errors.category = 'Invalid category';
  }

  if (!challenge.difficulty) {
    errors.difficulty = 'Difficulty is required';
  } else if (!Object.values(CHALLENGE_DIFFICULTIES).includes(challenge.difficulty)) {
    errors.difficulty = 'Invalid difficulty';
  }

  if (!challenge.points || challenge.points < 0) {
    errors.points = 'Points must be a positive number';
  }

  if (!challenge.flag?.trim()) {
    errors.flag = 'Flag is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// User validation
export const validateUser = (user) => {
  const errors = {};

  if (!user.username?.trim()) {
    errors.username = 'Username is required';
  } else if (user.username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  } else if (!/^[a-zA-Z0-9_]+$/.test(user.username)) {
    errors.username = 'Username can only contain letters, numbers, and underscores';
  }

  if (!user.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.email = 'Invalid email format';
  }

  if (user.password) {
    if (user.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(user.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Team validation
export const validateTeam = (team) => {
  const errors = {};

  if (!team.name?.trim()) {
    errors.name = 'Team name is required';
  } else if (team.name.length < 3) {
    errors.name = 'Team name must be at least 3 characters';
  }

  if (!team.description?.trim()) {
    errors.description = 'Description is required';
  } else if (team.description.length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }

  if (!team.maxMembers || team.maxMembers < 2 || team.maxMembers > 10) {
    errors.maxMembers = 'Team size must be between 2 and 10 members';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Writeup validation
export const validateWriteup = (writeup) => {
  const errors = {};

  if (!writeup.title?.trim()) {
    errors.title = 'Title is required';
  } else if (writeup.title.length < 5) {
    errors.title = 'Title must be at least 5 characters';
  }

  if (!writeup.content?.trim()) {
    errors.content = 'Content is required';
  } else if (writeup.content.length < 50) {
    errors.content = 'Content must be at least 50 characters';
  }

  if (!writeup.difficulty) {
    errors.difficulty = 'Difficulty is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Event validation
export const validateEvent = (event) => {
  const errors = {};
  const now = new Date();

  if (!event.name?.trim()) {
    errors.name = 'Event name is required';
  }

  if (!event.description?.trim()) {
    errors.description = 'Description is required';
  }

  if (!event.startDate) {
    errors.startDate = 'Start date is required';
  } else if (new Date(event.startDate) < now) {
    errors.startDate = 'Start date must be in the future';
  }

  if (!event.endDate) {
    errors.endDate = 'End date is required';
  } else if (new Date(event.endDate) <= new Date(event.startDate)) {
    errors.endDate = 'End date must be after start date';
  }

  if (event.prizePool && event.prizePool < 0) {
    errors.prizePool = 'Prize pool must be positive';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// File validation
export const validateFile = (file, options = {}) => {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [] } = options;
  const errors = [];

  if (file.size > maxSize) {
    errors.push(`File size must be less than ${maxSize / 1024 / 1024}MB`);
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};