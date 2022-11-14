const fs = require("fs");
const resultsFile = "./results.json";
const surveyFile = "./survey.json";

function InMemoryDBAdapter(session) {
  function getTable(dataFile) {
    let table = session[dataFile];
    if (!table) {
      table = [];
      session[dataFile] = table;
    }
    return table;
  }
  async function getDataJsonFile(dataFile) {
    try {
      return await JSON.parse(fs.readFileSync(dataFile, "utf8") || []);
    } catch (err) {
      console.log("Err: ", err);
      return false;
    }
  }

  async function setDataJsonFile(dataFile, data) {
    await fs.writeFile("./survey.json", JSON.stringify(data), (err) => {
      if (err) {
        console.log("Failed to write updated data to file !");
        return;
      }
      console.log(`Updated data to ${dataFile} file successfully !`);
      return;
    });
  }

  async function getObjectsFromStorage(surveyFile, callback) {
    let table = await getDataJsonFile(surveyFile);
    callback(table);
  }

  function findById(objects, id) {
    return objects.filter(function (o) {
      return o.id === id;
    })[0];
  }

  async function addSurvey(name, callback) {
    let getDataAsync = await getDataJsonFile(surveyFile);
    if (getDataAsync) {
      let currentId = getDataAsync.length + 1;
      const newObj = {
        id: "" + currentId,
        name: name || "Survey" + " " + currentId,
        json: "{}",
      };
      const addData = [...getDataAsync, newObj];
      await setDataJsonFile(surveyFile, addData);
      callback(newObj);
    }
  }

  function postResults(postId, dataResult, userWindown, callback) {
    if (postId && Object.keys(dataResult).length > 0) {
      const dataFormat = {
        id: postId,
        data: [{ ...dataResult, userWindown }],
      };
      fs.readFile(resultsFile, function (err, data) {
        const json = JSON.parse(data) || [];
        const array = [...json];
        const findIndex = array.findIndex((item) => item.id === postId);
        if (findIndex >= 0) {
          array[findIndex]?.data.push(...dataFormat?.data);
        } else {
          array.push(dataFormat);
        }
        fs.writeFile(resultsFile, JSON.stringify(array), (err) => {
          if (err) {
            console.log("Failed to write updated data to file !");
            return;
          }
          console.log("Updated file to results.json file successfully !");
        });
      });
      callback({});
    }
  }

  function getResults(postId, callback) {
    fs.readFile(resultsFile, function (err, data) {
      let dataJson = JSON.parse(data);
      let results = findById(dataJson, postId);
      callback(results);
    });
  }

  async function deleteSurvey(surveyId, callback) {
    let table = await getDataJsonFile(surveyFile);
    const findIndex = table.findIndex((item) => item.id == surveyId);
    if (findIndex >= 0) {
      const newData = table.filter((item) => {
        return item.id !== surveyId;
      });
      await setDataJsonFile(surveyFile, newData);
      callback(findIndex);
    }
  }

  async function storeSurvey(surveyId, name, json, callback) {
    let table = await getDataJsonFile(surveyFile);
    const findIndex = table.findIndex((item) => item.id == surveyId);
    if (findIndex >= 0) {
      table[findIndex].json = { ...json };
      await setDataJsonFile(surveyFile, table);
    }
    callback?.(findIndex);
  }

  function changeName(id, name, callback) {
    let table = getTable("surveys");
    let survey = findById(table, id);
    if (!!survey) {
      survey.name = name;
    }
    callback && callback(survey);
  }

  async function getSurveys(callback) {
    await getObjectsFromStorage(surveyFile, async function (objects) {
      if (objects.length > 0) {
        callback(objects);
      } else {
        await getObjectsFromStorage(surveyFile, callback);
      }
    });
  }

  function getSurvey(surveyId, callback) {
    getSurveys(function (surveys) {
      callback(findById(surveys, surveyId));
    });
  }
  return {
    addSurvey,
    getSurvey,
    storeSurvey,
    getSurveys,
    deleteSurvey,
    postResults,
    getResults,
    changeName,
  };
}

module.exports = InMemoryDBAdapter;
