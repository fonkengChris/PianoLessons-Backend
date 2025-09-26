import { User, ROLES } from "../models/user.js";

export default async function (req, res, next) {
  const user = await User.findById(req.user._id);
  if (!user || (user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN)) {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
}
