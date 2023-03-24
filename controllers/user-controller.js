//const uuidv4 = require('uuid');
//const uuidv4 = require('uuid/v4');
var models = require("../models");
const bcrypt = require("bcrypt");
const auth = require("basic-auth");
const compare = require("tsscmp");
const saltRounds = 10;
const { winston, logger } = require("../winston/winston");
const statD = require("../statsD/statD");

exports.health = (req, res) => {
  let message = { message: "Server Working" };
  logger.info("Triggered Healthz");

  statD.increment("web.healthz");

  res.status(200).end(JSON.stringify(message));
};

exports.create = (req, res) => {
  //var id = uuidv4.v4();
  var first_name = req.body.first_name;
  var last_name = req.body.last_name;
  var password = req.body.password;
  var username = req.body.username;
  var dateval = new Date();
  dateval = dateval.toISOString();

  var emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  var charRegex = /^[A-Za-z.-]+(\s*[A-Za-z.-]+)*$/;
  var len = password.length;
  var validemail = emailRegex.test(username);
  var validfname = charRegex.test(first_name);
  var validlname = charRegex.test(last_name);

  if (Object.keys(req.body).length === 0) {
    logger.error("No fields");
    res.status(400).send({
      Message: "You have no fields",
    });
  }
  if (!first_name || !last_name || !username) {
    logger.error("Enter all details");
    res.status(400).send({
      Message:
        "Please fill out the first name, last name, password, and email address fields!",
    });
  }
  if (Object.keys(req.body).length > 4) {
    logger.error("Additional details");
    res.status(400).send({
      Message: "You have given additional fields!",
    });
  }
  if (password.length === 0 || len < 8 || len > 64) {
    logger.error("Password length");
    res.status(400).send({
      Message:
        "Password length should be larger than 8 and only contain characters!",
    });
  } else if (!validemail) {
    logger.error("Invalid email address");
    res.status(400).send({
      Message: "Please enter a valid email address!",
    });
  } else if (!validfname) {
    logger.error("Invalid name");
    res.status(400).send({
      Message: "Please enter a valid first name with characters!",
    });
  } else if (!validlname) {
    res.status(400).send({
      Message: "Please enter a valid last name with characters!",
    });
  } else {
    bcrypt.hash(password, saltRounds, function (err, hash) {
      if (err) {
        logger.error("Couldn't store the Password !");
      } else {
        var User = models.User.build({
          //id:id,
          first_name: first_name,
          last_name: last_name,
          password: hash,
          username: username,
          account_created: dateval,
          account_updated: dateval,
        });
        User.save()
          .then(function (err) {
            console.log(User);
            logger.info("User created successfully");
            statD.increment("web.usercreate");
            User.password = undefined;
            res.status(201).send(User);
          })
          .catch(function (err) {
            logger.error("User already exist" + err);
            res.status(400).send("User with this email already exist !");
          });
      }
    });
  }
};

exports.view = (req, res) => {
  //var owner_user_id = result[0].id;
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
        var UserFound;
        valid = compare(username, result[0].username) && valid;
        valid = bcrypt.compareSync(password, result[0].password) && valid;
        var authenticatedUserId = result[0].id;

        if (valid) {
          if (req.params.userId !== authenticatedUserId + "") {
            logger.error("User gave another user id");
            res.status(403).send("Forbidden Access");
          }
          logger.info("User details found in system");
          statD.increment("web.userview");
          UserFound = {
            id: result[0].id,
            first_name: result[0].first_name,
            last_name: result[0].last_name,
            email_address: result[0].username,
            account_created: result[0].account_created,
            account_updated: result[0].account_updated,
          };
          res.statusCode = 200;
          res.send(UserFound);
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
        res.statusCode = 401;
        res.setHeader("WWW-Authenticate", 'Basic realm="user Authentication"');
        res.end("Access denied");
      });
  }
};

exports.update = (req, res) => {
  var credentials = auth(req);

  var first_name = req.body.first_name;
  var last_name = req.body.last_name;
  var password1 = req.body.password;
  //var email_address = req.body.username;
  var account_created = req.body.account_created;
  var account_updated = req.body.account_updated;
  // var id = req.params.userId;

  var dateval = new Date();
  dateval = dateval.toISOString();

  if (!credentials) {
    logger.error("No authorization credentials found in request");
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", 'Basic realm="user Authentication"');
    res.end("Access denied");
  } else if (!first_name || !last_name || !password1) {
    logger.error("Please enter all details");
    res.status(400).send({
      Message:
        "Please provide all required fields - first_name, last_name, password, email_address!",
    });
  } else if (account_created || account_updated) {
    //console.log("test");
    logger.error("Error while updating user");
    res.status(400).send({
      Message:
        "Fields apart from 'first_name, last_name, password, email_address' should not be in request body !",
    });
  } else if (Object.keys(req.body).length > 4) {
    logger.error("User gave additional field");
    res.status(400).send({
      Message: "You have given additional fields!",
    });
  } else {
    var username = credentials.name;
    var password = credentials.pass;

    models.User.findAll({
      where: {
        username,
      },
    })
      .then(function (result) {
        console.log(result);
        var valid = true;
        valid = bcrypt.compareSync(password, result[0].password) && valid;
        valid = compare(username, username) && valid;

        var authenticatedUserId = result[0].id;

        // console.log("Result ID: "+result[0].id);

        // console.log("Param ID: "+req.params.userId);

        if (valid) {
          console.log("validated");
          bcrypt.hash(password1, saltRounds, function (err, hash) {
            if (err) {
              console.log(err);
            } else {
              if (req.params.userId !== authenticatedUserId + "") {
                logger.error("User gave another user id");
                res.status(403).send("Forbidden Access");
              }

              models.User.update(
                {
                  first_name: first_name,
                  last_name: last_name,
                  password: hash,
                  account_updated: dateval,
                },
                {
                  where: {
                    username,
                  },
                }
              )
                .then(function () {
                  logger.info("User details updated successfully");
                  statD.increment("web.userupdate");
                  res.status(204).end();
                })
                .catch(function (err) {
                  logger.error("Error" + err);
                  console.log(err);
                  res.status(400).end();
                });
            }
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
        console.log(err);
      });
  }
};
