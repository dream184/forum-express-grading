const passport = require('passport')
const LocalStrategy = require('passport-local')
const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User
const Restaurant = db.Restaurant
  
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },

  (req, username, password, done) => {
    User.findOne({ where: { email: username } })
      .then(user => {
        if (!user) return done(null, false, req.flash('error_messages', '帳號輸入錯誤!'))
        if (!bcrypt.compareSync(password, user.password)) return done(null, false, req.flash('error_messages', '密碼輸入錯誤!'))
        return done(null, user)
      })
  }
))

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  User.findByPk(id, {
    include: [
      { model: Restaurant, as: 'FavoritedRestaurants' }
    ]
  }).then(user => {
    user = user.toJSON()
    return done(null, user)
  })
})

module.exports = passport