module.exports = (app) => {
  // const multer = require("multer");
  // const upload = multer({ dest: "uploads/" });

  const user = require("../controllers/user-controller");
  const product = require("../controllers/product-controller");
  // const file = require('../controllers/file-controller');
  const inavlidRoute = require("../invalidRoute");
  // const imageController = require('../controllers/image-controller');

  app.post("/v1/user", user.create);
  app.get("/v1/user/:userId", user.view);
  app.put("/v1/user/:userId", user.update);

  app.get("/health", user.health);

  app.post("/v1/product", product.create);
  app.get("/v1/product/:id", product.viewProducts);
  //app.get('/v1/product/:id',product.getProduct);
  app.put("/v1/product/:id", product.updateProduct);
  app.patch("/v1/product/:id", product.updatingProduct);
  app.delete("/v1/product/:id", product.deleteProduct);

  app.all("*", inavlidRoute.routeError);
};
