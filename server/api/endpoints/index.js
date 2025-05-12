const login = require('./login');
const signup = require('./signup');
const logout = require('./logout');
const currentUser = require('./currentUser');
const deleteUser = require('./deleteUser');
const uploadImage = require('./uploadImage');

module.exports = {
  login,
  signup,
  logout,
  currentUser,
  deleteUser,
  uploadImage,
};
