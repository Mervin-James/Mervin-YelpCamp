const User = require('../models/user');


module.exports.renderRegister = (req, res) => {
    res.render('users/register');
};

module.exports.register = async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);

        //logs the new user automatically
        //"req.login" has a callback for errors
        req.login(registeredUser, err => {
            if (err) return next(err);  //goes to the next error-handling middleware
            req.flash('success', 'Welcome to Yelp Camp!');
            res.redirect('/campgrounds');
        });

    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
}

module.exports.renderLogin = (rew, res) => {
    res.render('users/login');
}

module.exports.login = (req, res) => {
    req.flash('success', 'Welcome back!');
    const redirectUrl = req.session.returnTo || '/campgrounds';     //defaults to '/campgrounds' if returnTo is undefined
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

module.exports.logout = (req, res) => {
    req.logout();       //passport logout method
    req.flash('success', 'Goodbye!');
    res.redirect('/campgrounds');
}