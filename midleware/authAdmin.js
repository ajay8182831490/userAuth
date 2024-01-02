const authorizeAdmin = (req, res, next) => {

    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }
    next();
}

module.exports = authorizeAdmin;