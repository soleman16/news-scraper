var db = require("../models");

module.exports = function (app) {

  // Load index page and only return articles that weren't saved to favorites
  app.get("/", function (req, res) {
    db.Article.find({saved: false})
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
    db.Article.find({saved: true})
    .then(function (dbArticles) {
      // If we were able to successfully find Articles, send them back to the client
      console.log(dbArticles);
      let result = {
        articles: dbArticles
      }
      res.render("saved", result);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
  });

};
