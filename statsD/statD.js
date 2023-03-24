// const SDC = require("statsd-client");
// import SDC from "node-statsd";

const SDC = require("hot-shots");

const statD = new SDC({
  //   host: "localhost",
  port: 8125,
});

module.exports = statD;
