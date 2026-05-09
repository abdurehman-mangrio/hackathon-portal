// Challenge categories
export const CHALLENGE_CATEGORIES = {
  WEB: 'web',
  CRYPTO: 'crypto',
  FORENSICS: 'forensics',
  REVERSING: 'reversing',
  PWN: 'pwn',
  MISC: 'misc',
  OSINT: 'osint',
  STEALTH: 'stealth'
};

// Challenge difficulties
export const CHALLENGE_DIFFICULTIES = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EXPERT: 'expert'
};

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator'
};

// Event types
export const EVENT_TYPES = {
  CTF: 'ctf',
  JEOPARDY: 'jeopardy',
  ATTACK_DEFENSE: 'attack_defense',
  WORKSHOP: 'workshop'
};

// Achievement types
export const ACHIEVEMENT_TYPES = {
  FIRST_BLOOD: 'first_blood',
  COMPLETIONIST: 'completionist',
  SPEEDRUNNER: 'speedrunner',
  CATEGORY_MASTER: 'category_master',
  STREAK: 'streak'
};

// File upload limits
export const FILE_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_TOTAL_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/zip',
    'application/x-tar',
    'application/gzip'
  ]
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/me'
  },
  CHALLENGES: '/challenges',
  USERS: '/users',
  TEAMS: '/teams',
  SUBMISSIONS: '/submissions',
  LEADERBOARD: '/leaderboard'
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  THEME: 'theme',
  USER: 'user',
  LANGUAGE: 'language'
};

// Socket events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  SUBMISSION_UPDATE: 'submission_update',
  LEADERBOARD_UPDATE: 'leaderboard_update',
  NOTIFICATION: 'notification',
  CHAT_MESSAGE: 'chat_message'
};

// Date formats
export const DATE_FORMATS = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  WITH_TIME: 'MMM dd, yyyy HH:mm',
  FULL: 'EEEE, MMMM dd, yyyy HH:mm'
};