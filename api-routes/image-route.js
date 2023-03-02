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

const unLink = util.promisify(fs.unlink);
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
      return callback(
        new Error("Only .png, .jpg and .jpeg format are allowed")
      );
    }
  },
});

const router = Router();

router.post("/v1/product/:id/image", upload.single("image"), (req, res) => {
  var credentials = auth(req);
  if (!credentials) {
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

    if (!productId) {
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
                console.log(
                  "Product already has a file attached, please delete that before uploading a new File !"
                );
              } else {
                const file = req.file;
                console.log(file);
                if (file === undefined) {
                  // console.log(response);
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
                      console.log("Image already exists");
                      res.status(400).send({ message: "Image already exists" });
                    } else {
                      awsConfig
                        .uploadToS3(file, filePartition)
                        .then((result) => {
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
                              console.log(response);
                              res.status(201).send("File uploaded");
                            })
                            .catch((err) => {
                              console.error(err);
                              res.status(400).send(err);
                            });
                        })
                        .catch((error) => {
                          console.error(error);
                          // res.send(error);
                        });
                    }
                  });
                }
              }
            })
            .catch(function (err) {
              console.error(err);
              res.status(404).send("Product is not found !");
            });
        }
      })
      .catch(function (err) {
        console.error(err);
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
                    // console.log("🤦‍♀️");
                    res.status(200).send();
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
                  } else res.status(404).end();
                })
                .catch(function (err) {
                  console.log(err);
                });
            } else {
              res.statusCode = 401;
              res.setHeader(
                "WWW-Authenticate",
                'Basic realm="user Authentication"'
              );
              res.end("Access denied");
            }
          })
          .catch(function (err) {
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

    if (!isNumeric(req.params.productId) || !isNumeric(req.params.image_id)) {
      res.status(404).send("Please provide valid product id or valid image id");
    } else if (productId !== username) {
      res.status(403).send("Access forbidden");
    } else {
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
                if (UserProduct) {
                  models.Image.findAll({
                    where: {
                      product_id: productId,
                    },
                  })
                    .then(function (Image) {
                      Image.productId = undefined;

                      res.status(200).send(Image);
                    })
                    .catch(function (err) {
                      res.status(404).send("Product is not found !");
                    });
                } else res.status(404).end();
              })
              .catch(function (err) {
                console.log(err);
              });
          } else {
            res.statusCode = 401;
            res.setHeader(
              "WWW-Authenticate",
              'Basic realm="user Authentication"'
            );
            res.end("Access denied");
          }
        })
        .catch(function (err) {
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

router.delete(
  "/v1/product/:id/image/:image_id",

  (req, res) => {
    var credentials = auth(req);
    if (!credentials) {
      res.statusCode = 401;
      res.setHeader("WWW-Authenticate", 'Basic realm="user Authentication"');
      res.end("Access denied");
    } else {
      var username = credentials.name;
      var password = credentials.pass;
      // var productId = req.url.split("/")[3];
      let image_id = req.params.image_id;
      let productId = req.params.id;

      if (!productId || !image_id) {
        res.status(404).send({
          Message: "Please provide correct Product Id and Image Id !!",
        });
      }
      models.User.findAll({
        where: {
          username,
        },
      })
        .then(function (User) {
          var valid = true;
          valid = bcrypt.compareSync(password, User[0].password) && valid;
          if (valid) {
            models.Product.findOne({
              where: {
                id: productId,
                owner_user_id: User[0].id,
              },
            })
              .then(function (UserProduct) {
                if (UserProduct) {
                  models.Image.findOne({
                    where: {
                      image_id: image_id,
                      product_id: productId,
                    },
                  })
                    .then(function (ImageRet) {
                      var filePath = ImageRet.file_name;

                      console.log("Deleting the image");

                      awsConfig
                        .deleteFromS3(filePath)
                        .then(function (DelImage) {
                          models.Image.destroy({
                            where: {
                              image_id,
                              product_id: productId,
                            },
                          });

                          res.sendStatus(204);
                        });
                    })
                    .catch(function (err) {
                      res.status(404).send("Image record doesn't exist !!");
                    });
                } else {
                  res.status(404).end();
                }
              })
              .catch(function (err) {
                console.log(err);
                res.status(404).send("Product record doesn't exist !!");
              });
          } else {
            res.statusCode = 401;
            res.setHeader(
              "WWW-Authenticate",
              'Basic realm="user Authentication"'
            );
            res.end("Access denied");
          }
        })
        .catch(function (err) {
          res.statusCode = 401;
          res.setHeader(
            "WWW-Authenticate",
            'Basic realm="user Authentication"'
          );
          res.end("Access denied");
        });
    }
  }
);
