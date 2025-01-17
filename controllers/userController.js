const bcrypt = require('bcryptjs')
const imgur = require('imgur-node-api')
const db = require('../models')
const User = db.User
const Comment = db.Comment
const Restaurant = db.Restaurant
const Favorite = db.Favorite
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID

const userController = {
  signUpPage: (req, res) => {
    return res.render('signup')
  },
  
  signUp: (req, res) => {
    if (req.body.passwordCheck !== req.body.password) {
      req.flash('error_messages', '兩次密碼輸入不同!')
      return res.redirect('/signup')
    } else {
      User.findOne({ where: { email: req.body.email } })
        .then(user => {
          if (user) {
            req.flash('error_messages', '信箱重複!')
            return res.redirect('/signup')
          } else {
            User.create({
              name: req.body.name,
              email: req.body.email,
              password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10), null)
            })
              .then(user => {
                req.flash('success_messages', '成功註冊帳號!')
                return res.redirect('/signin')
              })
          }
        })
    }
  },

  signInPage: (req, res) => {
    return res.render('signin')
  },

  signIn: (req, res) => {
    req.flash('success_messages', '成功登入!')
    res.redirect('/restaurants')
  },

  logout: (req, res) => {
    req.flash('success_messages', '登出成功!')
    req.logout()
    res.redirect('/signin')
  },
  getUser: (req, res) => { 
    return User.findByPk(req.params.id, {
      include: [{
        model: Comment, include: [Restaurant]
      }]
    })
      .then((user) => {
        return res.render('profile', { user: user.toJSON() })
      })
  },
  editUser: (req, res) => {
    return User.findByPk(req.params.id)
      .then((user) => {
        return res.render('edit', { user: user.toJSON() })
      })
  },
  putUser: (req, res) => {
    if (!req.body.name) {
      req.flash('error_messages', "name didn't exist")
      return res.redirect('back')
    }
    const { file } = req
    if (file) {
      imgur.setClientID(IMGUR_CLIENT_ID)
      imgur.upload(file.path, (err, img) => {
        return User.findByPk(req.params.id)
          .then((user) => {          
            return user.update({
              name: req.body.name,
              email: req.body.email,
              image: file ? img.data.link : null
            })
              .then((user) => {
                req.flash('success_messages', '使用者資料編輯成功')
                res.redirect('/users/${req.params.id}')
              })
          })
      })
    } else {
      return User.findByPk(req.params.id)
        .then((user) => {
          user.update({
            name: req.body.name,
            email: req.body.email
          })
        })
        .then((user) => {
          req.flash('success_messages','使用者資料編輯成功')
          res.redirect(`/users/${req.params.id}`)
        })
    }
  },
  addFavorite: (req, res) => {
    return Favorite.create({
      UserId: req.user.id,
      RestaurantId: req.params.restaurantId
    })
      .then((restaurant) => {
        return res.redirect('back')
      })
  },
  removeFavorite: (req, res) => {
    return Favorite.findOne({
      where: {
        UserId: req.user.id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then((favorite) => {
        favorite.destroy()
          .then((restaurant) => {
            return res.redirect('back')
          })
      })
  }
}

module.exports = userController