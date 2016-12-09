// transit.ts: collection of functions for retrieving data from 511.org's API

// External resources
// typed
import * as request from 'request';
import * as qs from 'querystring';
import * as moment from 'moment';

export const API_URL = 'http://api.511.org/transit/';
export const API_KEY = process.env.ORG_511_API_KEY;

// Used to remove the byte order mark (BOM).
// The 511.org includes one at the start of data which causes JSON.parse to fail.
function stripBOM(utfString: string) {
  if (utfString.charCodeAt(0) === 0XFEFF) {
    return utfString.slice(1);
  }
  else {
    return utfString;
  }
}

// simple wrapper for JSON.parse that will strip the BOM (if present) from the string before invoking
function parseJSON(jsonString: string) {
  return JSON.parse(stripBOM(jsonString));
}

// construct and return an URL for making a request to 511.org
// apiMethod: method to request, e.g. 'stops'
// apiKeyValues: object containing key-value pairs to be encoded into the query string portion of the URL
function buildRequestUrl(apiMethod: string, apiKeyValues: any) {
  return API_URL + apiMethod + '?api_key=' + API_KEY + '&' + qs.stringify(apiKeyValues);
}

// Request all known operators that 511.org provides, e.g. SFMTA, BART, Caltrain, etc.
export function getOperators(): Promise<any> {
  let apiOptions = {
    format: 'json'
  };

  let reqOptions = {
    method: 'GET',
    url: buildRequestUrl('operators', apiOptions),
    gzip: true
  }

  return new Promise<any>((resolve, reject) => {
    request(reqOptions, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        resolve(parseJSON(body));
      }
      else {
        reject({error: error, response: response});
        return;
      }
    })
  })
}

export interface Line {
  Id: string,
  Name: string
}

// Request all SFMTA lines from 511.org, e.g. 22, 33, J, etc.
export function getLines(): Promise<Line[]> {
  let apiOptions = {
    format: 'json',
    operator_id: 'SFMTA'
  };

  let reqOptions = {
    method: 'GET',
    url: buildRequestUrl('lines', apiOptions),
    gzip: true
  }

  return new Promise<Line[]>((resolve, reject) => {
    request(reqOptions, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        try {
          resolve(parseJSON(body));
        }
        catch (error) {
          reject({error: error, action: 'parsing getLines response'});
          return;
        }
      }
      else {
        reject({error: error, response: response});
        return;
      }
    })
  })
}

export interface Stop {
  id: string,
  Name: string
}

// Request all SFMTA stops from 511.org. e.g. 24th & Folsom, NOTE: may take upwards of 10 seconds
export function getStops(): Promise<Stop[]> {
  let apiOptions = {
    format: 'json',
    operator_id: 'SFMTA'
  };

  let reqOptions = {
    method: 'GET',
    url: buildRequestUrl('stops', apiOptions),
    gzip: true
  }

  return new Promise<Stop[]>((resolve, reject) => {
    request(reqOptions, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        try {
          resolve(parseJSON(body).Contents.dataObjects.ScheduledStopPoint);
        }
        catch (error) {
          reject({error: error, action: 'parsing getStops response'});
          return;
        }
      }
      else {
        reject({error: error, response: response});
        return;
      }
    })
  })
}

export interface Prediction {
  stopName: string;
  operator: string;
  lineId: string;
  lineName: string;
  direction: string;
  minutesTilDeparture: number;
};

// The data structure for realtime predictions returned by 511.org is nested and has some unwieldy names
// This function maps every prediction, aka "MonitoredStopVisit", to an object conforming to the Prediction interface defined above
export function mapDataToPredictions(prediction: any): Prediction[] {
  const now = moment();
  return prediction.map(visit => {
    let departureTime = moment(visit.MonitoredVehicleJourney.MonitoredCall.AimedDepartureTime);
    return {
      stopName: visit.MonitoredVehicleJourney.MonitoredCall.StopPointName,
      operator: visit.MonitoredVehicleJourney.OperatorRef,
      lineId: visit.MonitoredVehicleJourney.LineRef,
      lineName: visit.MonitoredVehicleJourney.PublishedLineName,
      direction: visit.MonitoredVehicleJourney.DirectionRef,
      minutesTilDeparture: departureTime.diff(now, 'minutes')
    };
  })
}

// Request predictions for a given stopId
// 511.org API returns predictions for all lines servicing a given stop
export function getPredictionsForStop(stopId: number): Promise<Prediction[]> {
  let apiOptions = {
    format: 'json',
    agency: 'sf-muni',
    stopCode: stopId
  };

  let reqOptions = {
    method: 'GET',
    url: buildRequestUrl('StopMonitoring', apiOptions),
    gzip: true
  }

  return new Promise<any>((resolve, reject) => {
    request(reqOptions, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        try {
          resolve(mapDataToPredictions(parseJSON(body).ServiceDelivery.StopMonitoringDelivery.MonitoredStopVisit));
        }
        catch (error) {
          reject({error: error, action: 'parsing getPredictionsForStop response'});
          return;
        }
      }
      else {
        reject({error: error, response: response});
        return;
      }
    });
  });
}
