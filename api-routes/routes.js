module.exports = (app) => {
    const user = require('../controllers/user-controller');
    app.post('/v1/user',user.create);
    app.get('/v1/user/:uuid',user.view);
    app.put('/v1/user/:uuid',user.update);
    app.get('/healthz',user.health);
}
