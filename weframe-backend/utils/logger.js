const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

module.exports = { log };