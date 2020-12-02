const Campground = require('../models/campground');
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require("../cloudinary");


module.exports.index = async (req, res) => {
    const mapCampgrounds = await Campground.find({}).populate("popUpText");
    const perPage = 8;
    const pageQuery = parseInt(req.query.page);
    const pageNumber = pageQuery ? pageQuery : 1;
    Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
        Campground.countDocuments().exec(function (err, count) {
            if (err) {
                console.log(err);
            } else {
                res.render("campgrounds/index", {
                    mapCampgrounds,
                    campgrounds: allCampgrounds,
                    current: pageNumber,
                    pages: Math.ceil(count / perPage)
                });
            }
        });
    });

    // res.render('campgrounds/index', { campgrounds })
}

module.exports.renderNewForm = (req, res) => {         //dont need async function b/c we aren't waiting for data from database
    res.render('campgrounds/new');
}

module.exports.createCampground = async (req, res, next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1,
    }).send();
    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry;
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));   //implicit return that maps image(s)'s path and fileName to an array
    campground.author = req.user._id;
    await campground.save();
    req.flash('success', 'Successfully made a new campground!');
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.showCampground = async (req, res, next) => {
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!campground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground })
}

module.exports.renderEditForm = async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground })
}

module.exports.updateCampground = async (req, res) => {
    // const campground = req.body.campground;
    // await Campground.updateOne({ "_id": campground._id }, { campground });
    // res.redirect(`/campgrounds/${campground._id}`);
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground })  //uses the spread operator to define campground using '...req.body.campground'
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }))
    campground.images.push(...imgs);            //spreads operator on the elemets of imgs array
    await campground.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);  //removes image from cloudinary
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
    }
    req.flash('success', "Successfully updated campground!");
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted campground!');
    res.redirect('/campgrounds')
}