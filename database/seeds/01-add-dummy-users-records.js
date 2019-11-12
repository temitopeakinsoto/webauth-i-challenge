
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('users').truncate()
    .then(function () {
      // Inserts seed entries
      return knex('users').insert([
        {username: "admin", password: '1234'},
        {username: "test", password: '12345'},
        {username: "tops", password: '123456'}
      ]);
    });
};
