if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const MongoDBStore = require('connect-mongo')(session);

const userRoutes = require('./routes/users')
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');


// const dbUrl = process.env.DB_URL;
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected');
});

const app = express();

app.engine('ejs', ejsMate)     //assigning engine to use ejs-mate so we can use boilerplates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// RUN ON EVERY SINGLE REQUEST (even if the request is gibberish)
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));  //uses static assets from "/public" folder
app.use(mongoSanitize());       //implements basic security measures

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';
const store = new MongoDBStore({        //using MongDBStore to store information
    url: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60
})

store.on('error', function (e) {
    console.log('SESSION STORE ERROR', e);
});

const sessionConfig = {
    store,
    name: '_instance',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    }
}
app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

// helmet Content Security Policy (CSP), we are specfiying which sites/resources we are allowed to use in YelpCamp
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    //add any new script resources here
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    // "https://stackpath.bootstrapcdn.com/",
    "https://cdn.jsdelivr.net",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/diil8j2cv/",
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

app.use(passport.initialize());   //initilizes "passport" in an express-based application
app.use(passport.session());  //allows for persistent sessions where user is logged in
passport.use(new LocalStrategy(User.authenticate()));   //".authenticate()" is a static method added automatically by passport by .plugin()

// storing and unstoring the User in the server session
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// middlware that is running on ALL requests
app.use((req, res, next) => {
    res.locals.currentUser = req.user;  //passport method to get email + username info of client

    //if there is something inside req.flash('success'), we will add it to res.locals
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');

    next();
});

// route handling
app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes)
app.use('/campgrounds/:id/reviews', reviewRoutes)


app.get('/', (req, res) => {
    res.render('home');
});


// "app.all" runs for EVERY single request
// in this case, this method only runs if none of the other routing methods above have ended the call-cycle
// "*" means for every single PATH
app.all("*", (req, res, next) => {
    next(new ExpressError("Page Not Found", 404));
});

// error-handling middleware
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!';
    res.status(statusCode).render('error', { err }); //renders error.ejs inside views>error.ejs
});

app.listen(3000, () => {
    console.log("Serving on port 3000");
});
