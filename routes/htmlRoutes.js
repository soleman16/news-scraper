var db = require("../models");

module.exports = function (app) {

  // Load index page
  app.get("/", function (req, res) {
    db.Article.find({})
    .then(function (dbArticles) {
      // If we were able to successfully find Articles, send them back to the client
      console.log(dbArticles);
      let result = {
        articles: dbArticles
      }
      res.render("index", result);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
    
  });

  app.get("/saved",
  function (req, res) {

  });

};
