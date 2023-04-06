const auth = require("basic-auth");
var models = require("../models");
const { Router } = require("express");
const bcrypt = require("bcrypt");
const multer = require("multer");
const awsConfig = require("../config/aws-config");
const { where } = require("sequelize");
const fs = require("fs");
const util = require("util");
const { v4 } = require("uuid");
const { logger } = require("../winston/winston");
// const { logger } = require("../winston/winston");
//const { model } = require("mongoose");
const url = require("url");
const statD = require("../statsD/statD");
const WrongFormatError = require("../custom-errors/WrongFormatError");

const unLink = util.promisify(fs.unlink);

// const __dirname = url.fileUrlPath(new URL(".", import.meta.url));
// const upload = multer({ dest: __dirname + "/uploads/" });

const upload = multer({
  dest: __dirname + "/uploads/",
  fileFilter: (req, file, callback) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      callback(null, true);
    } else {
      callback(null, false);
      logger.error("Provided invalid  file extension");
      return callback(
        new WrongFormatError("Only .png, .jpg and .jpeg format are allowed")
      );
    }
  },
});

const router = Router();

router.post("/v1/product/:id/image", upload.single("image"), (req, res) => {
  var credentials = auth(req);
  if (!credentials) {
    logger.error("No authorization credentials found in request");
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", 'Basic realm="user Authentication"');
    res.end("Access denied");
  } else {
    var username = credentials.name;
    var password = credentials.pass;
    // var productId = req.url.split("/")[3];
    // let imageid = req.params.id;
    let productId = req.params.id;
    console.log(productId);

    const file = req.file;
    if (file === undefined || file === null) {
      logger.error("Add file");
      res.status(400).send({
        Message: "Please add a file",
      });
    }
    if (!productId) {
      logger.error("No Product Id found in request");
      res.status(400).send({
        Message: "Please provide correct Product Id !!",
      });
    }

    models.User.findAll({
      where: {
        username: username,
      },
    })
      .then(function (User) {
        var valid = true;
        valid = bcrypt.compareSync(password, User[0].password) && valid;
        if (valid) {
          // const file = req.file;
          // console.log(file);
          models.Product.findAll({
            where: {
              id: productId,
              owner_user_id: User[0].id,
            },
          })
            .then(function (Product) {
              if (Product[0].fileName) {
                logger.error(
                  "Product already has a file attached, can't duplicate entry"
                );
                // console.log(
                //   "Product already has a file attached, please delete that before uploading a new File !"
                // );
              } else {
                const file = req.file;
                console.log(file);
                if (file === undefined) {
                  // console.log(response);
                  logger.error("Error");
                  res.status(404).send();
                } else {
                  var productId = Product[0].id;
                  var file_name = file.originalname;
                  // var date_created = new Date().toISOString().split("T")[0];
                  // var s3_bucket_path = result.Location;

                  function imageExists(fileName) {
                    return models.Image.findOne({
                      where: { file_name: fileName },
                    });
                    // .then((image) => {
                    //   return image;
                    // })
                    // .catch((err) => {
                    //   res.send("There is an error");
                    // });
                  }
                  var filePartition = `ProductId:${productId}/${v4()}/${
                    req.file.originalname
                  }`;
                  imageExists(filePartition).then((exists) => {
                    if (exists) {
                      logger.error("Image exists already");
                      console.log("Image already exists");
                      res.status(400).send({ message: "Image already exists" });
                    } else {
                      awsConfig
                        .uploadToS3(file, filePartition)
                        .then((result) => {
                          logger.info(
                            "File successfully uploaded to S3 Bucket"
                          );
                          var productId = Product[0].id;
                          var file_name = filePartition;
                          var date_created = Date.now();
                          var s3_bucket_path = result.Location;

                          unLink(file.path);

                          // res.send("🤣");
                          models.Image.create({
                            product_id: productId,
                            file_name: file_name,
                            date_created: date_created,
                            s3_bucket_path: s3_bucket_path,
                          })
                            .then((response) => {
                              logger.info(
                                "Successful updated product with attached image"
                              );
                              statD.increment("web.imagepost");
                              console.log(response);
                              res.status(201).send(response);
                            })
                            .catch((err) => {
                              // console.error(err);
                              logger.error(
                                "Couldn't updated Product for image" + err
                              );
                              res.status(400).send(err);
                            });
                        })
                        .catch((error) => {
                          logger.error("Error" + err);
                          console.error(error);
                          // res.send(error);
                        });
                    }
                  });
                }
              }
            })
            .catch(function (err) {
              // console.error(err);
              logger.error("Product doesn't exist in system" + err);
              res.status(404).send("Product is not found !");
            });
        }
      })
      .catch(function (err) {
        // console.error(err);
        logger.error("User doesn't exist in system" + err);
        res.statusCode = 401;
        res.setHeader("WWW-Authenticate", 'Basic realm="user Authentication"');
        res.end("unauthorized");
      });

    // res.send("Successfully uploaded ✌");
  }
});

module.exports = router;

router.get(
  "/v1/product/:id/image/:image_id",
  // upload.single("image"),
  (req, res) => {
    var credentials = auth(req);
    if (!credentials) {
      logger.error("No authorization credentials found in request");
      res.statusCode = 401;
      res.setHeader("WWW-Authenticate", 'Basic realm="user Authentication"');
      res.end("Access denied");
    } else {
      var username = credentials.name;
      var password = credentials.pass;
      // var productId = req.url.split("/")[3];
      let image_id = req.params.image_id;
      let productId = req.params.id;

      const isNumeric = function (str) {
        if (typeof str != "string") return false;
        return !isNaN(str) && !isNaN(parseFloat(str));
      };

      if (!isNumeric(productId) || !isNumeric(image_id)) {
        logger.error("Product Id or Image Id Not found in request");
        res
          .status(404)
          .send("Please provide valid product id or valid image id");
      }
      // else if (owner_user_id !== userId) {
      //   res.status(404).send("Access forbidden");
      // }
      else {
        models.User.findAll({
          where: {
            username,
          },
        })
          .then(function (User) {
            var valid = true;
            valid = bcrypt.compareSync(password, User[0].password) && valid;

            if (valid) {
              models.Image.findOne({
                where: {
                  image_id: image_id,
                  // owner_id: User[0].id,
                  product_id: productId,
                },
              })
                .then(function (UserProduct) {
                  if (UserProduct) {
                    if (
                      UserProduct === null ||
                      UserProduct === undefined ||
                      UserProduct.length === 0
                    )
                      // console.log("🤦‍♀️");
                      statD.increment("web.imageget");
                    res.status(200).send(UserProduct);
                    // models.Image.findOne({
                    //   where: {
                    //     image_id: image_id,
                    //     product_id: productId,
                    //   },
                    // })
                    //   .then(function (File) {
                    //     File.productId = undefined;
                    //     res.status(200).send(File);
                    //   })
                    //   .catch(function (err) {
                    //     res.status(404).send("Product is not found !");
                    //   });
                  } else {
                    logger.error("Give correct image and product id");
                    res
                      .status(404)
                      .send(
                        "Give right image id for the product id: " + productId
                      );
                  }
                })
                .catch(function (err) {
                  logger.error("Error" + err);
                  console.log(err);
                });
            } else {
              logger.error("Access Denied");
              res.statusCode = 401;
              res.setHeader(
                "WWW-Authenticate",
                'Basic realm="user Authentication"'
              );
              res.end("Access denied");
            }
          })
          .catch(function (err) {
            logger.error("Access Denied" + err);
            res.statusCode = 401;
            res.setHeader(
              "WWW-Authenticate",
              'Basic realm="user Authentication"'
            );
            res.end("Access denied");
          });
      }
    }
  }
);

router.get("/v1/product/:id/image", (req, res) => {
  var credentials = auth(req);
  if (!credentials) {
    logger.error("No authorization credentials found in request");
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", 'Basic realm="user Authentication"');
    res.end("Access denied");
  } else {
    var username = credentials.name;
    var password = credentials.pass;
    // var productId = req.url.split("/")[3];
    let image_id = req.params.image_id;
    let productId = req.params.id;

    const isNumeric = function (str) {
      if (typeof str != "string") return false;
      return !isNaN(str) && !isNaN(parseFloat(str));
    };

    if (!isNumeric(productId)) {
      logger.error("Enter valid product id");
      res.status(404).send("Please provide valid product id");
    }
    // if (productId !== username) {
    //   res.status(403).send("Access forbidden");
    // }
    else {
      models.User.findAll({
        where: {
          username,
        },
      })
        .then(function (User) {
          var valid = true;
          valid = bcrypt.compareSync(password, User[0].password) && valid;
          if (valid) {
            models.Image.findAll({
              where: {
                // owner_id: User[0].id,
                product_id: productId,
              },
            })
              .then(function (UserProduct) {
                console.log(UserProduct);
                if (UserProduct) {
                  if (
                    UserProduct === null ||
                    UserProduct === undefined ||
                    UserProduct.length === 0
                  ) {
                    res.status(404).send("Images not found");
                  } else {
                    statD.increment("web.imagegetall");
                    res.status(200).send(UserProduct);
                  }
                } else {
                  logger.error("Enter valid image id and product id");
                  res
                    .status(404)
                    .send(
                      "Give right image id for the product id: " + productId
                    );
                }
              })
              .catch(function (err) {
                logger.error("Error" + err);
                console.log(err);
              });
          } else {
            logger.error("Error");
            res.statusCode = 401;
            res.setHeader(
              "WWW-Authenticate",
              'Basic realm="user Authentication"'
            );
            res.end("Access denied");
          }
        })
        .catch(function (err) {
          logger.error("Error" + err);
          res.statusCode = 401;
          res.setHeader(
            "WWW-Authenticate",
            'Basic realm="user Authentication"'
          );
          res.end("Access denied");
        });
    }
  }
});

// router.delete(
//   "/v1/product/:id/image/:image_id",
//   (req, res) => {
//     var credentials = auth(req);
//     if (!credentials) {
//       res.statusCode = 401;
//       res.setHeader("WWW-Authenticate", 'Basic realm="user Authentication"');
//       res.end("Access denied");
//     } else {
//       var username = credentials.name;
//       var password = credentials.pass;
//       // var productId = req.url.split("/")[3];
//       let image_id = req.params.image_id;
//       let productId = req.params.id;

//       if (!productId || !image_id) {
//         res.status(404).send({
//           Message: "Please provide correct Product Id and Image Id !!",
//         });
//       }
//       models.User.findAll({
//         where: {
//           username,
//         },
//       })
//         .then(function (User) {
//           var valid = true;
//           valid = bcrypt.compareSync(password, User[0].password) && valid;
//           if (valid) {
//             models.Product.findOne({
//               where: {
//                 id: productId,
//                 owner_user_id: User[0].id,
//               },
//             })
//               .then(function (UserProduct) {
//                 console.log("This is the user product");
//                 console.log(UserProduct);

//                 if (
//                   UserProduct === undefined ||
//                   UserProduct === null ||
//                   UserProduct.length === 0
//                 ) {
//                   res.send(404).send("Forbidden");
//                 }

//                 if (UserProduct) {
//                   models.Image.findOne({
//                     where: {
//                       image_id: image_id,
//                       product_id: productId,
//                     },
//                   })
//                     .then(function (ImageRet) {
//                       var filePath = ImageRet.file_name;

//                       console.log("Deleting the image");

//                       awsConfig
//                         .deleteFromS3(filePath)
//                         .then(function (DelImage) {
//                           models.Image.destroy({
//                             where: {
//                               image_id,
//                               product_id: productId,
//                             },
//                           });

//                           res.sendStatus(204);
//                         });
//                     })
//                     .catch(function (err) {
//                       res.status(404).send("Image record doesn't exist !!");
//                     });
//                 } else {
//                   res.status(404).status("My Choice");
//                 }

//                 // ending the if(UserProduct)
//               })
//               .catch(function (err) {
//                 console.log(err);
//                 res.status(404).send("Product record doesn't exist !!");
//               });
//           } else {
//             res.statusCode = 401;
//             res.setHeader(
//               "WWW-Authenticate",
//               'Basic realm="user Authentication"'
//             );
//             res.end("Access denied");
//           }
//         })
//         .catch(function (err) {
//           res.statusCode = 401;
//           res.setHeader(
//             "WWW-Authenticate",
//             'Basic realm="user Authentication"'
//           );
//           res.end("Access denied");
//         });
//     }
//   }
// );

router.delete("/v1/product/:id/image/:image_id", (req, res) => {
  var credentials = auth(req);
  if (!credentials) {
    logger.error("No authorization credentials found in request");
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", 'Basic realm="user Authentication"');
    res.end("Access denied");
  } else {
    var username = credentials.name;
    var password = credentials.pass;
    let image_id = req.params.image_id;
    let productId = req.params.id;

    if (
      productId === null ||
      productId === undefined ||
      image_id === null ||
      image_id === undefined
    ) {
      logger.error("Product Id or Image Id Not found in request");
      res.status(400).send("Please give valid Product ID or Image ID");
    } else {
      models.User.findAll({
        where: {
          username,
        },
      })
        .then((user) => {
          console.log(user);

          if (user === null || user === undefined || user.length === 0) {
            logger.error("User not found");
            res.status(404).send("User Not Found");
          } else {
            models.Product.findOne({
              where: {
                id: productId,
                owner_user_id: user[0].id,
              },
            })
              .then((product) => {
                if (
                  product === null ||
                  product === undefined ||
                  product.length === 0
                ) {
                  logger.error("Forbidden Access");
                  res.status(403).send("Forbidden Access");
                } else {
                  models.Image.findOne({
                    where: {
                      image_id: image_id,
                      product_id: productId,
                    },
                  })
                    .then((image) => {
                      if (
                        image === null ||
                        image === undefined ||
                        image.length === 0
                      ) {
                        logger.error("Image not found for given product id");
                        res
                          .status(404)
                          .send(
                            "Image Not found for the given product id: " +
                              productId
                          );
                      } else {
                        // If everything is a successfully executed

                        var filePath = image.file_name;

                        awsConfig
                          .deleteFromS3(filePath)
                          .then((deleteImage) => {
                            logger.info("Deleted File from S3 Bucket");
                            models.Image.destroy({
                              where: {
                                image_id,
                              },
                            })
                              .then(function (result) {
                                logger.info(
                                  "Updated Product record after image deletion"
                                );
                                statD.increment("web.imagedelete");
                                res.status(204).send("Successfully Deleted");
                              })
                              .catch(function (error) {
                                logger.error(
                                  "Couldn't Update Product record after image deletion" +
                                    err
                                );
                                res.status(400).send(error);
                              });
                          })
                          .catch(function (error) {
                            logger.error(
                              "Issue while deleting the file record" + err
                            );
                            res.status(400).send(error);
                          });

                        // res.send("Success");
                      }
                    })
                    .catch(function (error) {
                      logger.error("File not found" + err);
                      res.status(400).send(error);
                    });
                }
              })
              .catch(function (err) {
                logger.error("Product not found" + err);
                res.status(400).send("Couldn't Fetch any products");
              });
          }
        })
        .catch(function (err) {
          logger.error("User doesn't exist in system" + err);
          res.status(401).send("Unable to fetch user");
        });
    }
  }
});
