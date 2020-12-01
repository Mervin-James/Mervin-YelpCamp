if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const mongoose = require('mongoose');
// The following have been stored in 'module.exports' in their respective files
const cities = require('./cities')
const Campground = require('../models/campground');
const { descriptors, places } = require('./seedHelpers')
//END

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
    for (let i = 0; i < 300; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author: '5fbc204cd661170303af1dc9',
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
            images: [
                {
                    url: 'https://res.cloudinary.com/diil8j2cv/image/upload/v1606347203/YelpCamp/uhwnxapvy5hcjme9tlht.jpg',
                    filename: "YelpCamp/uhwnxapvy5hcjme9tlht"
                },
                {
                    url: "https://res.cloudinary.com/diil8j2cv/image/upload/v1606346754/YelpCamp/noavf6jilbfz6wvolqo4.jpg",
                    filename: "YelpCamp/noavf6jilbfz6wvolqo4"
                }
            ]
        })
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();    //closes the connection after loading in all the campgrounds into database
});
