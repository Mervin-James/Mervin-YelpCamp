const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

//adds extension to Joi validation that sanitizes all user text inputs
const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});

const Joi = BaseJoi.extend(extension);

//Joi does SERVER-side validation of incoming request containing the new "campground" object
module.exports.campgroundSchema = Joi.object({
    campground: Joi.object({
        title: Joi.string().required().escapeHTML(),
        price: Joi.number().greater(3).required(),
        location: Joi.string().required().escapeHTML(),
        description: Joi.string().required().escapeHTML(),
    }).required(),
    deleteImages: Joi.array()


});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        body: Joi.string().required().escapeHTML(),
    }).required()

});

