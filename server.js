var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");

var PORT = process.env.PORT || 3000;

var app = express();

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

var expressHb = require("express-handlebars");

app.engine("handlebars", expressHb({ defaultLayout: "main", layoutsDir: __dirname + "/views/layouts" }));
app.set("view engine", "handlebars");
app.set("views", __dirname + "/views");

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/nbcNews";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

app.get("/scrape", function(req, res) {
  axios.get("https://www.nbcnews.com/").then(function(response) {
    var $ = cheerio.load(response.data);

    $("h3").each(function(i, element) {
      var result = {};

      result.title = $(this)
        .find("a")
        .text();

      result.link = $(this)
        .children("a")
        .attr("href");

      console.log(result.link)

      db.Article.create(result)
        .then(function(dbArticle) {
          console.log(dbArticle);
        })
        .catch(function(err) {
          console.log(err);
        });
    });

    res.send("Scrape Complete");
  });
});

app.get("/", function (req, res) {
  db.Article.find({})
  .then(function (dbArticle) {
    var data = {
      article: dbArticle,
    }
    res.render("index", data)
    console.log(dbArticle);
  }).catch(function (err) {
    res.json(err)
  })

});

app.get("/articles", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err)
    });
});

app.get("/articles/:id", function(req, res) {
  var ID = req.params.id;
  db.Article.findOne({ _id: ID })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.send(err);
    })
});

app.post("/articles/:id", function(req, res) {
  var ID = req.params.id;
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: ID }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get("/notes/:id", function (req, res) {
  var ID = req.params.id;
  db.Note.find({ _id: ID }).populate("Note")
    .then(function (dbNote) {
      res.json(dbNote)
    })
    .catch(function (err) {
      res.json(err)
    });
});

app.delete("/articles/delete", function (req, res) {
  db.Article.remove({})
  .then(function (response) {
    res.json(response)
  })
});
  
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});