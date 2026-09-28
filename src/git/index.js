module.exports = {
  git: require('./run'),
  ...require('./scan'),
  ...require('./message'),
  ...require('./sync'),
};
