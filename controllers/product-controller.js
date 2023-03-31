const auth = require("basic-auth");
const compare = require("tsscmp");
const saltRounds = 10;
var models = require("../models");
const { Sequelize, DataTypes } = require("sequelize");
const uuidv4 = require("uuid");
// const { logger } = require("../winston/winston");
const { winston, logger } = require("../winston/winston");
const statD = require("../statsD/statD");

//const uuidv4 = require('uuid/v4');

const bcrypt = require("bcrypt");
const { INTEGER } = require("sequelize");

exports.create = (req, res) => {
  var credentials = auth(req);
  if (!credentials) {
    logger.error("No authorization credentials found in request");
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", 'Basic realm="user Authentication"');
    res.end("Access denied");
  } else {
    var username = credentials.name;
    var password = credentials.pass;

    models.User.findAll({
      where: {
        username,
      },
    })
      .then(function (result) {
        var valid = true;
        valid = bcrypt.compareSync(password, result[0].password) && valid;
        if (valid) {
          //var uuid = uuidv4.v4();
          var name = req.body.name;
          var description = req.body.description;
          var sku = req.body.sku;
          var manufacturer = req.body.manufacturer;
          //categories = categories.join();
          let quantity = req.body.quantity;

          var owner_user_id = result[0].id;
          var datevalts = new Date();
          datevalts = datevalts.toISOString();
          var dateRegex = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;

          if (
            !name ||
            !description ||
            !sku ||
            !manufacturer ||
            !quantity ||
            quantity === undefined ||
            quantity === null ||
            !Number.isInteger(quantity)
          ) {
            logger.error("Provide all details");
            res.status(400).send({
              Message: "Please provide all required fields",
            });
          }
          // else if (isNaN(quantity) || quantity <= -1) {
          //   res.status(400).send({
          //     Message: "Please enter correct quantity!",
          //   });
          // } else if (quantity !== undefined || quantity !== null) {
          //   if (!Number.isInteger(quantity)) {
          //     res.send(400).send({
          //       Message: "Please enter correct quantity",
          //     });
          //   }
          // }
          else {
            models.Product.create({
              //id: uuid,
              //created_ts: datevalts,
              //updated_ts: datevalts,
              name: name,
              description: description,
              sku: sku,
              manufacturer: manufacturer,
              quantity: quantity,
              date_added: datevalts,
              date_last_updated: datevalts,
              owner_user_id: owner_user_id,
            })
              .then(function (Product) {
                logger.info("Product created successfully");
                statD.increment("web.productcreate");
                res.status(200).send(Product);
              })
              .catch(function (err) {
                console.log(err);
                logger.error("Couldn't create Product due to some issue" + err);
                res.status(400).send("Issue while creating Product !");
              });
          }
        } else {
          logger.error("User unauthorized");
          res.statusCode = 401;
          res.setHeader(
            "WWW-Authenticate",
            'Basic realm="user Authentication"'
          );
          res.end("Access denied");
        }
      })
      .catch(function (err) {
        logger.error("User doesn't exist in system" + err);
        console.log(err);
        res.statusCode = 401;
        res.setHeader("WWW-Authenticate", 'Basic realm="user Authentication"');
        res.end("Access denied");
      });
  }
};

exports.viewProducts = (req, res) => {
  var credentials = auth(req);
  if (!credentials) {
    logger.error("No authorization credentials found in request");
    // console.log("hello");
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", 'Basic realm="user Authentication"');
    res.end("Access Denied");
  } else {
    var username = credentials.name;
    var password = credentials.pass;
    models.User.findAll({
      where: {
        username,
      },
    })
      .then(function (result) {
        var valid = true;
        valid = bcrypt.compareSync(password, result[0].password) && valid;

        if (valid) {
          logger.info("Product found in system");
          models.Product.findOne({
            where: {
              id: req.params.id,
            },
          })
            .then(function (UserProducts) {
              statD.increment("web.productview");
              if (UserProducts) res.status(200).send(UserProducts);
              else {
                logger.error("Error");
                res.status(404).end();
              }
            })
            .catch(function (err) {
              logger.error(
                "Product coudn't be found due to some issue: " + err
              );
              console.log(err);
            });
        } else {
          logger.error("User unauthorized");
          res.statusCode = 401;
          res.setHeader(
            "WWW-Authenticate",
            'Basic realm="user Authentication"'
          );
          res.end("Access denied");
        }
        // else {
        //     res.status(403).send({
        //       message: 'Product not found or you are not authorized to access this product.'
        //     });
        //   }
      })
      .catch(function (err) {
        logger.error("User doesn't exist in system" + err);
        res.statusCode = 401;
        res.setHeader("WWW-Authenticate", 'Basic realm="user Authentication"');
        res.end("Access denied");
      });
  }
};

// exports.getProduct = (req, res) => {
//     var credentials = auth(req);
//     if (!credentials) {
//         console.log("hello");
//         res.statusCode = 401
//         res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
//         res.end('Access denied')
//     } else {
//         var username = credentials.name;
//         var password = credentials.pass;
//         var id = req.url.split("/")[3];
//         models.User.findAll({
//             where: {
//                 username
//             }
//         }).then(function(result) {
//             var valid = true;
//             valid = bcrypt.compareSync(password, result[0].password) && valid;
//             if (valid) {
//                 models.Product.findOne({
//                     where: {
//                         id: id

//                     }
//                 }).then(function(UserProduct) {
//                     if (UserProduct)
//                         res.status(200).send(UserProduct);

//                     else
//                     res.status(403).send({
//                         message: 'Product not found or you are not authorized to access this product.'
//                       });

//                 }).catch(function(err) {
//                     console.log(err);

//                 });

//             } else {
//                 res.statusCode = 401
//                 res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
//                 res.end('Access denied')
//             }
//         }).catch(function(err) {
//             res.statusCode = 401
//             res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
//             res.end('Access denied')
//         });

//     }

// }

exports.updateProduct = (req, res) => {
  var password = req.body.password;
  var credentials = auth(req);
  if (!credentials) {
    logger.error("No authorization credentials found in request");
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", 'Basic realm="user Authentication"');
    res.end("Unauthorized");
  } else {
    var username = credentials.name;
    var password = credentials.pass;
    var id = req.url.split("/")[3];
    models.User.findAll({
      where: {
        username,
      },
    })
      .then(function (result) {
        var valid = true;
        valid = bcrypt.compareSync(password, result[0].password) && valid;
        if (valid) {
          var name = req.body.name;
          var description = req.body.description;
          var sku = req.body.sku;
          var manufacturer = req.body.manufacturer;

          var quantity = req.body.quantity;

          var owner_user_id = result[0].id;
          var datevalts = new Date();
          datevalts = datevalts.toISOString();
          var dateRegex = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;

          if (!name || !description || !sku || !manufacturer || !quantity) {
            logger.error("Provide all details");
            res.status(400).send({
              Message:
                "Please provide all required fields - name, description, sku, manufacturer, quantity   !",
            });
          } else if (isNaN(quantity) || quantity < 0) {
            logger.error("Provide quantity in integer");
            res.status(400).send({
              Message:
                "Please enter correct quantity in integer and it should be greater than 0 ",
            });
          } else {
            models.Product.update(
              {
                updated_ts: datevalts,
                name: name,
                description: description,
                sku: sku,
                manufacturer: manufacturer,
                quantity: quantity,
              },
              {
                where: {
                  id: id,
                  owner_user_id: result[0].id,
                },
              }
            )
              .then(function (ProductUpdate) {
                if (ProductUpdate[0] > 0) {
                  models.Product.findOne({
                    where: {
                      id: id,
                    },
                  })
                    .then(function (updatedProduct) {
                      logger.info("Product details updated in system");
                      statD.increment("web.productupdate");
                      res.status(204).send(updatedProduct);
                    })
                    .catch(function (err) {
                      logger.error("Couldn't update Product details" + err);
                      console.log(err);
                    });
                } else {
                  logger.info("Product didn't get updated");
                  res.status(403).send({
                    message: "You are not authorized to access this product.",
                  });
                }
              })
              .catch(function (err) {
                logger.error("Error occured while updating Product" + err);
                console.log(err);
                res.status(404).send({
                  message: "Error while processing the request.",
                });
              });
          }
        } else {
          logger.error("User unauthorized");
          res.statusCode = 401;
          res.setHeader(
            "WWW-Authenticate",
            'Basic realm="user Authentication"'
          );
          res.end("Access denied");
        }
      })
      .catch(function (err) {
        logger.error("User doesn't exist in system" + err);
        // console.log(err);
        res.statusCode = 401;
        res.setHeader("WWW-Authenticate", 'Basic realm="user Authentication"');
        res.end("Access denied");
      });
  }
};

exports.deleteProduct = (req, res) => {
  var credentials = auth(req);
  if (!credentials) {
    logger.error("No authorization credentials found in request");
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", 'Basic realm="user Authentication"');
    res.end("Unauthorized");
  } else {
    var username = credentials.name;
    var password = credentials.pass;
    var id = req.url.split("/")[3];
    const isNumeric = function (str) {
      if (typeof str != "string") return false; // we only process strings!
      return (
        !isNaN(str) && // use type coercion to parse the entirety of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str))
      ); // ...and ensure strings of whitespace fail
    };

    if (id.lengh === 0 || !isNumeric(id)) {
      logger.error("Provide valid product id");
      res.status(400).send("Please provide a valid Product id to delete !");
    } else {
      models.User.findAll({
        where: {
          username,
        },
      })
        .then(function (result) {
          var valid = true;
          valid = bcrypt.compareSync(password, result[0].password) && valid;

          if (valid) {
            models.Product.destroy({
              where: {
                id: id,
                owner_user_id: result[0].id,
              },
            })
              .then(function (UserProduct) {
                logger.info("Product deleted Successfully");
                statD.increment("web.productdelete");
                if (UserProduct > 0) res.status(204).end();
                else {
                  logger.error("Not authorized to delete");
                  res.status(403).send({
                    message: "You are not authorized to delete this product.",
                  });
                }
              })
              .catch(function (err) {
                // console.log(err);
                logger.warn("Couldn't find product to delete" + err);
                res.status(404).send({
                  message: "Error while processing the request.",
                });
              });
          } else {
            logger.error("User unauthorized");
            res.statusCode = 401;
            res.setHeader(
              "WWW-Authenticate",
              'Basic realm="user Authentication"'
            );
            res.end("Unauthorized");
          }
        })
        .catch(function (err) {
          logger.error("User doesn't exist in system" + err);
          res.statusCode = 401;
          res.setHeader(
            "WWW-Authenticate",
            'Basic realm="user Authentication"'
          );
          res.end("Unauthorized");
        });
    }
  }
};

exports.updatingProduct = (req, res) => {
  const importantFields = [
    "name",
    "description",
    "manufacturer",
    "quantity",
    "sku",
  ];
  const RequestBodyKeys = req.body ? Object.keys(req.body) : null;
  let flag = true;
  if (!RequestBodyKeys || !RequestBodyKeys.length) {
    logger.error("Correct details are not provided");
    return res
      .status(400)
      .json("Correct details are not provided for updation of information");
  }
  RequestBodyKeys.forEach((val) => {
    if (importantFields.indexOf(val) < 0) {
      flag = false;
    }
  });
  if (!flag) {
    logger.error("Update correct fields");
    userFlag = true;
    return res
      .status(403)
      .json("You can update name, description,manufacturer and quantity only!");
  }

  const account_updated = new Date().toISOString();

  var credentials = auth(req);
  if (!credentials) {
    logger.error("No authorization credentials found in request");
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", 'Basic realm="user Authentication"');
    res.end("Unauthorized");
  } else {
    var username = credentials.name;
    var password = credentials.pass;

    models.User.findAll({
      where: {
        username,
      },
    })
      .then(function (result) {
        var valid = true;
        valid = bcrypt.compareSync(password, result[0].password) && valid;
        if (valid) {
          const id = req.params.id;
          const updates = req.body;
          models.Product.update(updates, {
            where: {
              id: id,
              owner_user_id: result[0].id,
            },
          })
            .then(function (rowsUpdated) {
              if (rowsUpdated > 0) {
                logger.info("Product details updated in system");
                statD.increment("web.productupdate");
                res.status(204).send({
                  message: "Product updated successfully.",
                });
              } else {
                logger.error("Not authorized for this product");
                res.status(403).send({
                  message: "You are not authorized to access this product.",
                });
              }
            })
            .catch(function (err) {
              logger.error("Couldn't update Product details" + err);
              console.log(err);

              res.status(400).send({
                message: "Error updating product.",
              });
            });
        } else {
          logger.error("User unauthorized");
          res.statusCode = 401;
          res.setHeader(
            "WWW-Authenticate",
            'Basic realm="user Authentication"'
          );
          res.end("Access denied");
        }
      })
      .catch(function (err) {
        // console.log(err);
        logger.error("User doesn't exist in system" + err);
        res.statusCode = 401;
        res.setHeader("WWW-Authenticate", 'Basic realm="user Authentication"');
        res.end("Access denied");
      });
  }
};
