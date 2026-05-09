export const CATEGORIES = {
  web: { 
    name: 'Web Exploitation', 
    icon: '🌐', 
    color: '#3B82F6',
    description: 'Find and exploit web vulnerabilities'
  },
  crypto: { 
    name: 'Cryptography', 
    icon: '🔐', 
    color: '#10B981',
    description: 'Decrypt and break cryptographic systems'
  },
  forensics: { 
    name: 'Forensics', 
    icon: '🔍', 
    color: '#F59E0B',
    description: 'Analyze files and recover hidden data'
  },
  pwn: { 
    name: 'Binary Exploitation', 
    icon: '💥', 
    color: '#EF4444',
    description: 'Exploit binary vulnerabilities'
  },
  reverse: { 
    name: 'Reverse Engineering', 
    icon: '⚡', 
    color: '#8B5CF6',
    description: 'Reverse engineer applications'
  },
  misc: { 
    name: 'Miscellaneous', 
    icon: '🎯', 
    color: '#6B7280',
    description: 'Various security challenges'
  }
};

export const DIFFICULTIES = {
  easy: { name: 'Easy', color: '#10B981', points: 100 },
  medium: { name: 'Medium', color: '#F59E0B', points: 300 },
  hard: { name: 'Hard', color: '#EF4444', points: 500 }
};