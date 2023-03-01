module.exports = (app) => {
  const multer = require("multer");
  const upload = multer({ dest: "uploads/" });

  const user = require("../controllers/user-controller");
  const product = require("../controllers/product-controller");
  // const file = require('../controllers/file-controller');
  const inavlidRoute = require("../invalidRoute");
  // const imageController = require('../controllers/image-controller');

  app.post("/v1/user", user.create);
  app.get("/v1/user/:userId", user.view);
  app.put("/v1/user/:userId", user.update);

  app.get("/healthz", user.health);

  app.post("/v1/product", product.create);
  app.get("/v1/product/:id", product.viewProducts);
  //app.get('/v1/product/:id',product.getProduct);
  app.put("/v1/product/:id", product.updateProduct);
  app.patch("/v1/product/:id", product.updatingProduct);
  app.delete("/v1/product/:id", product.deleteProduct);

  //app.post('/v1/product/:id/file', upload.single('image'),file.create);
  // app.post("/v1/product/:id/image", upload.single("image") ,imageController.uploadImage);
  // app.post("/v1/product/:id/image", upload.single("profile") ,(req, res) => {

  //     console.log(req.files);

  //     res.send("😁");

  // });

  app.post(
    "/v1/product/:productId/image",
    upload.single("image"),
    (request, response) => {
      const file = request.files;

      console.log(file.image);

      //   const result =  ImageUpload(file, request.params.productId);

      response.send({ message: "Successfully uploaded the file" });
    }
  );

  // app.get('/v1/product/:productid/file/:fileId',file.getFile);
  // app.delete('/v1/product/:productid/file/:fileId',file.deleteFile);

  app.all("*", inavlidRoute.routeError);
};
