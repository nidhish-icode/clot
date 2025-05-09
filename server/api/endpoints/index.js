const login = require('./login');
const signup = require('./signup');
const logout = require('./logout');
const currentUser = require('./currentUser');
const deleteUser = require('./deleteUser');

module.exports = {
  login,
  signup,
  logout,
  currentUser,
  deleteUser,
};
