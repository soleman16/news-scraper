var express = require("express");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("../models");

module.exports = function (app) {
  // A GET route for scraping the echoJS website
  app.get("/api/fetch", function (req, res) {
    // First, we grab the body of the html with axios
    axios.get("https://www.infoq.com/development").then(function (response) {
      // Then, we load that into cheerio and save it to $ for a shorthand selector
      var $ = cheerio.load(response.data);

      // Now, we grab every h2 within an article tag, and do the following:
      $("ul").each(function (i, element) {
        // Save an empty result object
        var result = {};

        // Add the text and href of every link, and save them as properties of the result object

        if ("articles" === $(this).data("tax")) {
          $(this).find("li").each(function (index, element) {
            let articleDiv = $(this).find("div").first();
            let anchorElement = articleDiv.children("a");
            let imageElement = anchorElement.children("img");

            result.link = "https://infoq.com" + anchorElement.attr("href");
            result.image = imageElement.attr("src");
            result.title = imageElement.attr("alt");
            result.saved = false;

            db.Article.create(result)
              .then(dbArticle => {
                // View the added result in the console
                console.log("website has been scrapped");
              })
              .catch(function (err) {
                // If an error occurred, log it
                console.log(err);
              });

          });
        }
      });

      // Send a message to the client
      res.send("Scrape Complete");
    });
  });

  // Route for getting all Articles from the db based on the '?saved'query parameter
  app.get("/api/headlines", function (req, res) {
    // Grab every document in the Articles collection
    const saved = req.query.saved;
    db.Article.find({ saved: saved })
      .then(function (dbArticle) {
        // If we were able to successfully find Articles, send them back to the client
        res.json(dbArticle);
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

  // Route for grabbing a specific Article by id, populate it with it's note
  app.get("/api/notes/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
      // ..and populate all of the notes associated with it
      .populate("_noteId")
      .then(function (dbArticle) {
        // If we were able to successfully find an Article with the given id, send it back to the client
        res.json(dbArticle._noteId.notes);
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

  // Route for saving/updating an Article's associated Note
  app.post("/api/notes", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.findOneAndUpdate({_headlineId: req.body._headlineId}, {$push: {notes: {noteText: req.body.noteText}}}, {upsert: true, new: true, setDefaultsOnInsert: true})
      .then(function (dbNote) {
        // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
        // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
        // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
        return db.Article.findOneAndUpdate({ _id: req.body._headlineId }, { _noteId: dbNote._id }, { new: true });
      })
      .then(function (dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

  // Route for updating an article if saved
  app.put("/api/headlines/:id", function (req, res) {
    db.Article.findOneAndUpdate({ _id: req.params.id }, { saved: req.body.saved }, { new: true }).then(result => {
      res.json(result);
    })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

    // Route for deleting an article if saved
    app.delete("/api/headlines/:id", function (req, res) {
      db.Article.remove({ _id: req.params.id }).then(result => {
        db.Note.remove({_headlineId: req.params.id}).then(result => {
          res.json(result);
        })
      })
        .catch(function (err) {
          // If an error occurred, send it to the client
          res.json(err);
        });
    });

    // Route for deleting a note
    app.delete("/api/notes/:id", function (req, res) {
      console.log(req.params);
      db.Note.update({}, {$pull: {notes: {_id: req.params.id}}}).then(result => {
        res.json(result);
      })
        .catch(function (err) {
          // If an error occurred, send it to the client
          res.json(err);
        });
    });

    // delete all documents from the collection
    app.get("/api/clear", function (req, res) {
      db.Article.remove({}).then(result => {
        db.Note.remove({}).then(result => {
          res.json(result);
        })
      })
        .catch(function (err) {
          // If an error occurred, send it to the client
          res.json(err);
        });
    });
}