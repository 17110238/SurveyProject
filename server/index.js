let express = require("express");
let bodyParser = require("body-parser");
let session = require("express-session");
let inmemorydbadapter = require("./inmemorydbadapter");
require("dotenv").config();
const cors = require("cors");
const os = require("os");
const port = process.env.PORT;

let app = express();
app.use(
  session({
    secret: "mysecret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let getDBAdapter = (req) => {
  let db = new inmemorydbadapter(req.session);
  return db;
};

function sendJsonResult(res, obj) {
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(obj));
}

app.get("/getActive", function (req, res) {
  let db = getDBAdapter(req);
  db.getSurveys(function (result) {
    sendJsonResult(res, result);
  });
});

app.get("/getSurvey", function (req, res) {
  let db = getDBAdapter(req);
  let surveyId = req.query["surveyId"];
  db.getSurvey(surveyId, function (result) {
    sendJsonResult(res, result);
  });
});

app.get("/changeName", function (req, res) {
  let db = getDBAdapter(req);
  let id = req.query["id"];
  let name = req.query["name"];
  db.changeName(id, name, function (result) {
    sendJsonResult(res, result);
  });
});

app.get("/create", function (req, res) {
  let db = getDBAdapter(req);
  let name = req.query["name"];
  db.addSurvey(name, function (survey) {
    sendJsonResult(res, survey);
  });
});

app.post("/changeJson", function (req, res) {
  let db = getDBAdapter(req);
  let id = req.body.id;
  let json = req.body.json;
  db.storeSurvey(id, null, json, function (survey) {
    sendJsonResult(res, survey);
  });
});

app.post("/post", function (req, res) {
  const db = getDBAdapter(req);
  const postId = req.body.postId;
  const userWindown = os.userInfo().username;
  const surveyResult = req.body.surveyResult;
  db.postResults(postId, surveyResult, userWindown, function (result) {
    sendJsonResult(res, result.json);
  });
});

app.get("/delete", function (req, res) {
  let db = getDBAdapter(req);
  let id = req.query["id"];
  db.deleteSurvey(id, function (result) {
    sendJsonResult(res, { id: id });
  });
});

app.get("/results", function (req, res) {
  let db = getDBAdapter(req);
  let postId = req.query["postId"];
  db.getResults(postId, function (result) {
    sendJsonResult(res, result);
  });
});

app.listen(port || 3005, function () {
  console.log(`Listening in port ${port || 3005}!`);
});
