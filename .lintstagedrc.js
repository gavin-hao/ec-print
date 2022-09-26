module.exports = {
  'src/**/*': ['prettier --write --ignore-unknown', 'git add'],
  'src/**/*.(j|t)s?(x)': 'eslint --cache --fix',
};
