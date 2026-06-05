const authorization = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden.',
        message: 'Your user profile role does not have authorization to view this resource.'
      });
    }

    next();
  };
};

module.exports = authorization;
