module.exports = (app) => {
    const user = require('../controllers/user-controller');
    const product = require('../controllers/product-controller');

    app.post('/v1/user',user.create);
    app.get('/v1/user/:userId',user.view);
    app.put('/v1/user/:userId',user.update);

    app.get('/healthz',user.health);

    app.post('/v1/product',product.create);
    app.get('/v1/product/:id',product.viewProducts);
    //app.get('/v1/product/:id',product.getProduct);
    app.put('/v1/product/:id',product.updateProduct);
    app.patch('/v1/product/:id',product.updatingProduct);
    app.delete('/v1/product/:id',product.deleteProduct);
}
