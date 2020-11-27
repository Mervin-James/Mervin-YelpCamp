const { string } = require('joi');
const mongoose = require('mongoose');
const Review = require('./review')
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
})

// adds a virtual "property" that we can use to rewrite the URL when accessing images from Cloudinary
ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});

// allows for virtuals to be included when parsing as a JSON
const opts = { toJSON: { virtuals: true } };
const CampgroundSchema = new Schema({
    title: String,
    images: [ImageSchema],
    geometry: {                 //setting up GeoJSON
        type: {
            type: String,
            enum: ['Point'],    //type NEEDS to be type point for "GeoJSON" functionality
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    price: Number,
    description: String,
    location: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
}, opts);
// registering a virual called "properties.popUpMarkup" for use in the pop-up text in Mapbox
CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
    return `<strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>
    <p>${this.description.substring(0, 20)}...</p>`
});

// "query" middleware, so can't use "this" to refer to "doc" object
CampgroundSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {   //makes sure we actually found and deleted a campground
        // removes all reviews whose "_id" fields match each entry in ("$in") the doc.reviews array
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})

module.exports = mongoose.model('Campground', CampgroundSchema);