// backend/middleware/admin.js
const admin = (req, res, next) => {
  // Check if user exists and has admin role
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Your schema uses 'admin' role
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

export default admin;