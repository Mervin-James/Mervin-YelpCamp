const express = require('express');
const router = express.Router({ mergeParams: true }); //gives us access to campground._id in the parameters that routed us to reviews.js

const Campground = require('../models/campground');
const Review = require('../models/review');
const review = require('../controllers/reviews');
const { validateReview, isLoggedIn, isReviewAuthor } = require('../middleware.js');
const catchAsync = require('../utils/catchAsync');

router.post('/', isLoggedIn, validateReview, catchAsync(review.createReview));

router.delete('/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(review.deleteReview));


module.exports = router;