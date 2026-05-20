const userModel = require('../../models/userModel');
const { success, error } = require('../../utils/response');

const toMeShape = async (userId, base) => {
  const roles = await userModel.getRoles(userId);
  return {
    id:        base.id,
    name:      base.name,
    email:     base.email,
    phone:     base.phone,
    gender:    base.gender ?? null,
    is_active: base.is_active,
    roles:     roles.map((r) => r.name),
  };
};

exports.updateProfile = async (req, res, next) => {
  try {
    const result = await userModel.updateCustomerProfile(req.user.id, req.body);
    if (!result) return error(res, 'No valid fields to update', 400);
    const user = await userModel.findById(req.user.id);
    if (!user) return error(res, 'User not found', 404);
    return success(res, await toMeShape(req.user.id, user), 'Profile updated successfully');
  } catch (err) { next(err); }
};
