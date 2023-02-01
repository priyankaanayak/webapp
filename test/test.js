const request = require('supertest');
const express = require('express');
var bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json())
require('../../api-routes/routes')(app);

describe('Post /v1/user', function(req,res) {
    it('responds with json', function(done) {
      request(app)
        .post('/v1/user')
        .send({
            "first_name": "",
            "last_name": "taneja",
            "password": "divya11235",
            "email_address": "divya@gmail.com"})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
        .end(function(err, res) {
            if (err) return done(err);
            done();
          });
    });
  });