// model.ts: retrieve data from 511.org to store in local files and create Alexa interaction-model

// External resources
// typed
import * as fs from 'fs';
import * as moment from 'moment';

// Internal resources
import {Stop, getStops, Line, getLines} from './transit';

function jsFriendlyJsonStringify (v, r?, s?) {
  return JSON.stringify(v, r, s).
  replace(/\u2028/g, '\\u2028').
  replace(/\u2029/g, '\\u2029');
}

// save JSON data as named variable in a local .ts file
export function saveJsonDataToFile(dataName: string, data: any[]) {
  const fileName = `./${dataName}.ts`;

  try {
    fs.writeFileSync(fileName, `export const ${dataName} = ${jsFriendlyJsonStringify(data, null, 2)}`);
  }
  catch (error) {
    console.log('error generating JSON file.', error);
  }
}

export function saveArrayToSlotFile(slotName: string, slotValues: string[]) {
  const fileName = `./${slotName}.txt`;

  try {
    for (let value of slotValues) {
      fs.appendFileSync(fileName, value);

      if (value === slotValues[slotValues.length - 1]) {
        break;
      }

      fs.appendFileSync(fileName, '\n');
    }
  }
  catch (error) {
    console.log('error generating file for slot: ',  error);
  }
}

function saveStopNamesToSlotFile(stops: Stop[]) {
  const stopNames = stops.map(stop => { return stop.Name; });
  saveArrayToSlotFile('stop-names', stopNames);
}

function saveStopIdsToFile(stops: Stop[]) {
  const stopIds = stops.map(stop => {return +stop.id;});
  stopIds.sort((a, b) => { return (a - b);});
  saveArrayToSlotFile('stop-ids', stopIds.map(x => { return x.toString(); }));
}

function saveLineIdsToFile(lines: Line[]) {
  const lineIds = lines.map(line => { return line.Id; });
  saveArrayToSlotFile('line-ids', lineIds);
}

async function buildModel() {
  try {
    let now = moment();

    // get data from 511 API...
    console.log(`Getting SFMTA lines from 511.org...`);

    const lines = await getLines();
    console.log(`Request to 511.org method 'lines' took: ${moment().diff(now, 'seconds', true)} seconds.`);

    // console.log(`Getting SFMTA stops from 511.org...`);
    //
    // now = moment();
    // const stops = await getStops();
    // console.log(`Request to 511.org method 'stops' took: ${moment().diff(now, 'seconds', true)} seconds.`);

    console.log(`Caching transit data to local files...`);

    // ...cache to file in order that we don't have to query each time.
    // This is to avoid the latency of querying the 511.org API for stops, which can take several seconds
    // saveJsonDataToFile('stops', stops);
    saveJsonDataToFile('lines', lines);

    console.log(`Creating slots file line-ids.txt...`);

    // create the Alexa slots that our interaction model will use
    saveLineIdsToFile(lines);
    const modelDir = 'interaction-model';
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir);
    }
    fs.renameSync('line-ids.txt', `./${modelDir}/line-ids.txt`);

    console.log(`Completed retrieving data from 511.org and saving to model.`);
  }
  catch (error) {
    console.log('failed to creating model! ', error);
  }
}

module.exports.buildModel = buildModel;
