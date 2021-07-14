
let lastHash;

hotEmitter.on('webpackHotUpdate', () => {
  if (!lastHash || lastHash == currentHash) {
    return lastHash = currentHash
  }
  hotCheck()
});
