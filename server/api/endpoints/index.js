const login = require('./login');
const signup = require('./signup');
const logout = require('./logout');
const currentUser = require('./currentUser');
const deleteUser = require('./deleteUser');
const uploadImage = require('./uploadImage');
const updateUserProfile = require('./updateUserProfile');

module.exports = {
  login,
  signup,
  logout,
  currentUser,
  deleteUser,
  uploadImage,
  updateUserProfile,
};
