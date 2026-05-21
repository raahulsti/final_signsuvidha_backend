const userModel = require('../../models/userModel');
const { pickUploadedProfileFile } = require('../../middleware/uploadS3');
const { success, error } = require('../../utils/response');
const { deleteFromS3 } = require('../../config/aws');

const toMeShape = async (userId, base) => {
  const roles = await userModel.getRoles(userId);
  return {
    id:                base.id,
    name:              base.name,
    email:             base.email,
    phone:             base.phone,
    gender:            base.gender ?? null,
    date_of_birth:     base.date_of_birth ?? null,
    profile_image_url: base.profile_image_url ?? null,
    is_active:         base.is_active,
    roles:             roles.map((r) => r.name),
  };
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return error(res, 'User not found', 404);

    const uploaded = pickUploadedProfileFile(req);
    if (uploaded?.location) {
      if (user.profile_image_url) await deleteFromS3(user.profile_image_url);
      req.body.profile_image_url = uploaded.location;
    }

    const result = await userModel.updateCustomerProfile(req.user.id, req.body);
    if (!result) return error(res, 'No valid fields to update', 400);
    const updated = await userModel.findById(req.user.id);
    if (!updated) return error(res, 'User not found', 404);
    return success(res, await toMeShape(req.user.id, updated), 'Profile updated successfully');
  } catch (err) { next(err); }
};
