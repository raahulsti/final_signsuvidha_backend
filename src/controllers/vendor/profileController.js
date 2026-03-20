const vendorModel = require('../../models/vendorModel');
const { success, notFound } = require('../../utils/response');
const { deleteFromS3 } = require('../../config/aws');

exports.getProfile = async (req, res, next) => {
  try {
    const vendor = await vendorModel.getByUserId(req.user.id);
    if (!vendor) return notFound(res, 'Vendor profile not found');
    return success(res, vendor);
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const vendor = await vendorModel.getByUserId(req.user.id);
    if (!vendor) return notFound(res, 'Vendor profile not found');
    if (req.file) {
      if (vendor.logo_url) await deleteFromS3(vendor.logo_url);
      req.body.logo_url = req.file.location;
    }
    await vendorModel.update(vendor.id, req.body);
    return success(res, {}, 'Profile updated successfully');
  } catch (err) { next(err); }
};
