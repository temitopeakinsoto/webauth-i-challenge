const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const Users = require("./users/users-model");
const session = require("express-session");
const KnexSessionStore = require('connect-session-knex')(session);

const server = express();

const sessionConfig = {
  name: "sentinel",
  secret: "shhhhhh!!!! keep it secret!",
  cookie: {
    maxAge: 60 * 60 * 1000,
    secure: false,
    httpOnly: true,
  },
  resave: false,
  saveUninitialized: false,
  store: new KnexSessionStore({
    knex: require('./database/db-config'),
    tablename: 'sessions',
    sidfieldname: 'sid',
    createtable: true,
    clearInterval: 1000 * 60 * 60
  })
};

server.use(helmet());
server.use(express.json());
server.use(cors());
server.use(session(sessionConfig));

function validateNewUser(req, res, next) {
  const newUserToBeRegistered = req.body;
  if (!newUserToBeRegistered) {
    res
      .status(400)
      .json({ message: `All new users must have required fields` });
  } else if (!newUserToBeRegistered.username) {
    res.status(400).json({ message: `User must have a username field` });
  } else if (!newUserToBeRegistered.password) {
    res.status(400).json({ message: "User must have a password field" });
  } else {
    req.user = newUserToBeRegistered;
    next();
  }
}

function restricted(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(400).json({ message: "No Credentials Supplied" });
  }
}

server.post("/api/login", validateNewUser, (req, res) => {
  const { username, password } = req.body;

  Users.findBy({ username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
        req.session.user = user;
        res.status(200).json({ message: `Welcome ${user.username}!` });
      } else {
        res.status(401).json({ message: "You Shall Not Pass!" });
      }
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

server.get("/api/users", restricted, (req, res) => {
  Users.find()
    .then(users => {
      res.json(users);
    })
    .catch(err => {
      res.status(500).json({ message: `There was an error: ${err.message}` });
    });
});

server.post("/api/register", validateNewUser, (req, res) => {
  let user = req.user;
  const hash = bcrypt.hashSync(user.password, 11);
  const newUser = {
    username: req.body.username,
    password: hash
  };

  Users.add(newUser)
    .then(createdUser => {
      res.status(201).json(createdUser);
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

server.get("/api/logout", (req, res) => {
  if (req.session && req.session.user) {
    req.session.destroy(err => {
      if (err) {
        res
          .status(400)
          .json({ message: `You was an error with this operation : ${err.message}` });
      } else {
        res.status(200).json({ message: "Bye, see you later!" });
      }
    });
  } else {
    res
      .status(400)
      .json({ message: "You were never logged-in in the first place!" });
  }
});

module.exports = server;
