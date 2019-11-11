const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require('bcryptjs')
const Users = require('./users/users-model');
const session = require("express-session");


const server = express();

const sessionConfig = {
    name: 'sentinel', 
    secret: 'shhhhhh!!!! keep it secret!', 
    cookie: {
      maxAge:  60 * 60 * 1000, 
      secure: false, 
      httpOnly: true 
    },
    resave: false, 
    saveUninitialized: false, 
  }

server.use(helmet());
server.use(express.json());
server.use(cors());
server.use(session(sessionConfig));

function validateNewUser(req, res, next){
    const newUserToBeRegistered = req.body;
    if (!newUserToBeRegistered) {
      res.status(400).json({ message: `All new users must have required fields` });
    } else if (!newUserToBeRegistered.username) {
      res
        .status(400)
        .json({ message: `User must have a username field` });
    } 
    else if(!newUserToBeRegistered.password){
        res.status(400).json({ message: "User must have a password field"})
    } else {
      req.user = newUserToBeRegistered;
      next();
    }
}

server.post('/api/login', validateNewUser, (req, res) => {
    let { username, password } = req.body;
  
    Users.findBy({ username })
      .first()
      .then(user => {
        if (user && bcrypt.compareSync(password, user.password)) {
            req.session.user = user;
          res.status(200).json({ message: `Welcome ${user.username}!` });
        } else {
          res.status(401).json({ message: 'You Shall Not Pass!' });
        }
      })
      .catch(error => {
        res.status(500).json(error);
      });
  });

server.get('/api/users', (req, res) => {
    Users.find()
    .then(users => {
      res.json(users);
    })
    .catch(err => {
        res.status(500).json({message: `There was an error: ${err.message}`});
    });
})

server.post('/api/register',validateNewUser, (req, res) => {
    let user = req.user;
    const hash = bcrypt.hashSync(user.password, 11)
    const newUser = {
      username: req.body.username,
      password: hash,
    };
  
    Users.add(newUser)
      .then(createdUser => {
        res.status(201).json(createdUser);
      })
      .catch(error => {
        res.status(500).json(error);
      });
  });

module.exports = server;
