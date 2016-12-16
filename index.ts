// External resources
// typed
import * as fs from 'fs';
import * as moment from 'moment';

// untyped
import * as Alexa from 'alexa-app';
import * as Multimap from 'multimap';

// Internal resources
import { lines } from './lines';
import { Prediction, getPredictionsForStop } from './transit';

const stopIds = process.env.STOP_IDS ? process.env.STOP_IDS.split('|') : undefined;
const lineIds = process.env.LINE_IDS ? process.env.LINE_IDS.split('|') : undefined;

let skill = new Alexa.app('alexa-sfmta');

function cancelIntentFunction(request, response) {
  response.say("Goodbye!");
}

skill.intent("AMAZON.CancelIntent", {}, cancelIntentFunction);
skill.intent("AMAZON.StopIntent", {}, cancelIntentFunction);

enum Conjunction {
  And,
  Or
}

// convert a string-convertible array of items into a comma delimited text string
// to be read by Alexa. The argument conjunction specifies whether the final item
// is preceded by either an 'and' or 'or'
function arrayToText(array: any[], conjunction: Conjunction): string {
  let text: string = '';
  for (let item of array) {
    text += item.toString();

    if (item === array[array.length - 1]) {
      break;
    }
    else if (item === array[array.length - 2]) {
      text += conjunction === Conjunction.And ? ' and ' : ' or ';
    }
    else {
      text += ', ';
    }
  }

  return text;
}

// The Alexa service isn't capable of speaking certain characters.
// Ampersand was thankfully the only one I stumbled across. In my case,
// the lambda invocation succeeded, but Alexa was didn't speak a single word of the response. (Silent failure.)
function sanitizeTextForAlexa(name: string): string {
  return name.replace('&', 'and');
}

// Creates the script for Alexa's response to the user.
// Groups predictions by line and direction to spare the user hearing those for every prediction, e.g.
// 'Inbound 22 in 4, 12, and 35 minutes'
// instead of:
// 'Inbound 22 in 4 minutes, Inbound 22 in 12 minutes, etc.'
function generateResponseFromPredictions(response, predictions: Prediction[]) {
  // first, group all predictions by line + direction
  let multimap = new Multimap();
  for (let prediction of predictions) {
    const predictionKey = prediction.lineId + prediction.direction;
    multimap.set(predictionKey, prediction);
  }

  // for each group, create the text and add it to our response
  multimap.forEachEntry((entry, key) => {
    const departures = entry.map(x => {return x.minutesTilDeparture;});
    const predictionText = `${entry[0].direction} ${entry[0].lineName} departing ${sanitizeTextForAlexa(entry[0].stopName)} in ${arrayToText(departures, Conjunction.And)} minutes.`;
    console.log(predictionText);
    response.say(predictionText);
  });
}

// returns an array of predictions that match the provided lineIds
function filterPredictionsByLineIds(predictions: Prediction[], lineIds: string[]): Prediction[] {
  if (lineIds === undefined || lineIds.length == 0) {
    return predictions;
  }

  let matchesAnyLineId = (prediction: Prediction): boolean => {
    for (let lineId of lineIds) {
      if (prediction.lineId === lineId) {
        return true;
      }
    }

    console.log(`prediction for the ${prediction.lineId} did not match any of the following criteria ${lineIds}`);

    return false;
  }

  return predictions.filter(matchesAnyLineId);
}

function sfmtaPredictionIntentHandler(request, response) {
  const requestedLineId: string = request.slot('LineId');

  console.log('sfmtaPredictionIntentHandler invoked with line: ' + requestedLineId);

  if (stopIds === undefined) {
    console.log(`No stopIds have been set. Please add the STOP_IDS environment variable to your lambda function.`);
    response.say(`I'm not sure which stops you'd like me to monitor. Please add the stop I.D. environment variable to your lambda function.`);
    response.send();
    return;
  }

  // for all stops being monitored, aka environment variable STOP_IDS, get the current predictions
  let predictionPromises: Promise<Prediction[]>[] = [];
  for (let stopId of stopIds) {
    predictionPromises.push(getPredictionsForStop(stopId));
  }

  // once all requests have completed, create the response for Alexa
  Promise.all(predictionPromises).then((predictionsForStop: Prediction[][]) => {
    // flatten 2d array of Predictions-by-stop into 1d array of Predictions
    let predictions = predictionsForStop.reduce((a, b) => { return a.concat(b); });
    console.log('received predictions: ' + JSON.stringify(predictions));

    // filter out predictions for lines that aren't specified in the LINE_IDS environment variable
    predictions = filterPredictionsByLineIds(predictions, lineIds);

    if (predictions.length < 1) {
      response.say(`No predictions are available at this time.`)
      response.send();
      return;
    }

    // if the user indicated a specific line, filter out predictions for all other lines
    if (requestedLineId !== undefined) {
      console.log(`Filtering predictions by requestedLineId: ${requestedLineId}`);
      predictions = predictions.filter(x => { return x.lineId === requestedLineId; });
    }

    if (predictions.length < 1) {
      response.say(`No predictions are available for the ${requestedLineId} at this time.`)
      response.send();
      return;
    }

    generateResponseFromPredictions(response, predictions);
    response.send();
  }).catch((error) => {
    console.log(error);
    response.say(`There was an error getting predictions. Please try again later.`);
    response.send();
    return;
  });

  // alexa-app requires that intent handlers return false if asynchronous.
  // Otherwise, the framework returns an empty response to the Alexa service prior to the Promise(s) being fulfilled above.
  return false;
}

skill.intent('sfmtaPredictionIntentHandler', {
  'slots': {
    'LineId': 'LINEIDS'
  },
  'utterances': [
    'when will my {bus|train} {arrive|get here|leave|depart}',
    'when is my {bus|train} {coming|due|arriving|departing|leaving}',
    'when will the {|next} {-|LineId} {arrive|get here|leave|depart}',
    'when is the {|next} {-|LineId} {coming|due|arriving|departing|leaving}',
    'when the {|next} {-|LineId} is {coming|due|arriving|departing|leaving}']
}, sfmtaPredictionIntentHandler);

function saveToTextFile(name: string, data: string) {
  try {
    const fileName = `interaction-model/${name}.txt`;
    let fileStream = fs.createWriteStream(fileName);
    fileStream.write(data);
  }
  catch (error) {
    console.log(`failed to write ${name} to file.`);
  }
}

function buildModel() {
  const modelDir = 'interaction-model';
  if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir);
  }

  console.log('saving schema to file...');
  saveToTextFile('schema', skill.schema());
  console.log('saving utterances to file...');
  saveToTextFile('utterances', skill.utterances());
  console.log('alexa-app interaction-model complete.');
}

module.exports = skill;
module.exports.buildModel = buildModel;
