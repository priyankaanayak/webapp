const CustomError = require("./CustomError");

class WrongFormatError extends CustomError {
  statusCode = 400;

  constructor(message) {
    super(message);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

module.exports = WrongFormatError;
