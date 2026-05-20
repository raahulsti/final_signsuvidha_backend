const Joi = require('joi');
const { CMS_PAGE_SLUGS } = require('../../utils/constants');

const slugParam = Joi.object({
  slug: Joi.string().valid(...CMS_PAGE_SLUGS).required(),
});

const update = Joi.object({
  title:     Joi.string().min(2).max(200).optional(),
  content:   Joi.string().allow('', null).optional(),
  is_active: Joi.boolean().truthy('true', '1', 1).falsy('false', '0', 0, '').optional(),
}).min(1);

module.exports = { slugParam, update };
