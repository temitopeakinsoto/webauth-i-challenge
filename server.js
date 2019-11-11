const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require('bcryptjs')
const Users = require('./users/users-model');


const server = express();

server.use(helmet());
server.use(express.json());
server.use(cors());

server.get('/', (req, res) => {
  res.send("It's alive!");
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

server.post('/api/register', (req, res) => {
    let user = req.body;
    const hash = bcrypt.hashSync(user.password, 11)
    const newUser = {
      username: req.body.username,
      password: hash,
    };
  
    Users.add(newUser)
      .then(saved => {
        res.status(201).json(saved);
      })
      .catch(error => {
        res.status(500).json(error);
      });
  });

module.exports = server;
