const CustomError = require("../custom-errors/CustomError");

function errorHandler(err, req, res, next) {
  console.log("Err:  " + err);

  if (err instanceof CustomError) {
    return res.status(err.statusCode).send({ error: err.serializeErrors() });
  }

  res.status(400).send({
    message: "Something went wrong",
  });
}

module.exports = errorHandler;
