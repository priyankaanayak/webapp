exports.routeError = (req, res) => {
    res.status(404).send("Entered URL is not found!");

}