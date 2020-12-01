if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const mongoose = require('mongoose');

const cities = require('./cities')
const Campground = require('../models/campground');
const { descriptors, places, campImages } = require('./seedHelpers');
const { firstNames, lastNames } = require('./names')
const User = require('../models/user');

const dbURL = process.env.DB_URL;

mongoose.connect(dbURL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected');
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    await User.deleteMany({});

    let alreadyUsedNames = [];

    for (let i = 0; i < 300; i++) {
        let randomFirstName = 0;
        let randomLastName = 0;

        do {
            randomFirstName = Math.floor(Math.random() * 200);
            randomLastName = Math.floor(Math.random() * 100);
            const namePair = `${randomFirstName}${randomLastName}`
            if (!alreadyUsedNames.includes(namePair)) {
                alreadyUsedNames.push(namePair);
                break;
            }
        } while (true);




        const user = new User({
            email: `testAlpha${i}@g.com`,
            username: `${firstNames[randomFirstName]} ${lastNames[randomLastName]}`
        })
        await user.save();

        // assigning campground images
        const images = [];
        let rand1 = 0;
        let rand2 = 0;
        let rand3 = 0;
        do {
            rand1 = Math.floor(Math.random() * 24);
            rand2 = Math.floor(Math.random() * 24);
            rand3 = Math.floor(Math.random() * 24);
        } while (rand1 === rand2 || rand2 === rand3);

        const image1 = {
            url: campImages[rand1],
            fileName: campImages[rand1].substring(62)
        }
        const image2 = {
            url: campImages[rand2],
            fileName: campImages[rand2].substring(62)
        }
        images.push(image1);
        images.push(image2);

        if (Math.random() > 0.5) {
            const image3 = {
                url: campImages[rand3],
                fileName: campImages[rand3].substring(62)
            }
            images.push(image3);
        }

        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author: user._id,
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ea odit, enim aliquam, totam debitis, facilis nemo nam molestias soluta tenetur voluptate aliquid sed ut. Maiores animi neque architecto illum laboriosam!",
            price,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude
                ]
            },
            images,
        })
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();    //closes the connection after loading in all the campgrounds into database
});
