const { campgroundSchema, reviewSchema } = require('./schemas.js');  //JOI schema
const ExpressError = require('./utils/ExpressError')
const Campground = require('./models/campground');
const Review = require('./models/review')

module.exports.isLoggedIn = (req, res, next) => {

    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in!');
        return res.redirect('/login');      //make sure to 'return' b/c we dont want the code below to run
    }
    next();
}


module.exports.validateCampground = (req, res, next) => {
    //this "campgroundSchema" has nothing to do with the express schema "campgroundSchema", 
    //we just call it that for easy reference when using "campgroundSchema" with Joi
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(element => element.message).join(',');    //error.details returns an ARRAY that contains all the error messages
        throw new ExpressError(msg, 400)    //will go straight ahead to the next ERROR-handling middlware (and skip all the get/post routes)
    } else {
        next();
    }
}

module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/campgrounds/${id}`)
    }
    next();
}

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;        //id and reviewId are inside the WHOLE ENTIRE link for this route
    const review = await Review.findById(reviewId);
    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/campgrounds/${id}`)
    }
    next();
}

