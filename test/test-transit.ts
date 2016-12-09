import test from 'ava';
import * as fs from 'fs';
import * as nock from 'nock';

import * as transit from '../transit';

let responseFixtures: Map<string, any>;
const fixtureNames: string[] = [
  'invalid',
  'operators',
  'lines',
  'stops',
  'predictions'
];

test.before('setup response fixtures', t => {
  responseFixtures = new Map<string, any>();

  for (let fixture of fixtureNames) {
    responseFixtures.set(fixture, JSON.parse(fs.readFileSync(`./test/fixture-${fixture}-response.json`).toString()));
  }
});

test('getOperators invalid response', t => {
  let sfmta = nock(transit.API_URL)
              .get(/operators/)
              .reply(401, responseFixtures.get('invalid'));

  return transit.getOperators()
                .then(result => {
                  t.fail();
                })
                .catch(error => {
                  t.pass();
                });
});

test('getOperators valid response', t => {
  const expected = responseFixtures.get('operators');
  let sfmta = nock(transit.API_URL)
              .get(/operators/)
              .reply(200, expected);

  return transit.getOperators()
                .then(result => {
                  t.deepEqual(result, expected);
                })
                .catch(error => {
                  t.fail();
                });
});

test('getStops invalid status', t => {
  let sfmta = nock(transit.API_URL)
              .get(/stops/)
              .reply(401, responseFixtures.get('invalid'));

  return transit.getStops()
                .then(result => {
                  t.fail();
                })
                .catch(error => {
                  t.pass();
                });
});

test('getStops invalid response', t => {
  let sfmta = nock(transit.API_URL)
              .get(/stops/)
              .reply(200, responseFixtures.get('invalid'));

  return transit.getStops()
                .then(result => {
                  t.fail();
                })
                .catch(error => {
                  t.pass();
                });
});

test('getStops valid response', t => {
  const fixture = responseFixtures.get('stops');
  let sfmta = nock(transit.API_URL)
              .get(/stops/)
              .reply(200, fixture);

  return transit.getStops()
                .then(result => {
                  const expected = fixture.Contents.dataObjects.ScheduledStopPoint;
                  t.deepEqual(result, expected);
                })
                .catch(error => {
                  console.log(error);
                  t.fail();
                });
});

test('getLines invalid status', t => {
  let sfmta = nock(transit.API_URL)
              .get(/lines/)
              .reply(401, responseFixtures.get('invalid'));

  return transit.getLines()
                .then(result => {
                  t.fail();
                })
                .catch(error => {
                  t.pass();
                });
});

test('getLines invalid response', t => {
  let sfmta = nock(transit.API_URL)
              .get(/lines/)
              .reply(200, responseFixtures.get('invalid'));

  return transit.getLines()
                .then(result => {
                  t.fail();
                })
                .catch(error => {
                  console.log(error);
                  t.pass();
                });
});

test('getLines valid response', t => {
  const expected = responseFixtures.get('lines');
  let sfmta = nock(transit.API_URL)
              .get(/lines/)
              .reply(200, expected);

  return transit.getLines()
                .then(result => {
                  t.deepEqual(result, expected);
                })
                .catch(error => {
                  console.log(error);
                  t.fail();
                });
});

test('getPredictionsForStop invalid status', t => {
  let sfmta = nock(transit.API_URL)
              .get(/StopMonitoring/)
              .reply(401, responseFixtures.get('invalid'));

  return transit.getPredictionsForStop(12345)
                .then(result => {
                  t.fail();
                })
                .catch(error => {
                  t.pass();
                });
});

test('getPredictionsForStop invalid response', t => {
  let sfmta = nock(transit.API_URL)
              .get(/StopMonitoring/)
              .reply(200, responseFixtures.get('invalid'));

  return transit.getPredictionsForStop(12345)
                .then(result => {
                  t.fail();
                })
                .catch(error => {
                  t.pass();
                });
});

test('getPredictionsForStop valid response', t => {
  const fixture = responseFixtures.get('predictions');
  let sfmta = nock(transit.API_URL)
              .get(/StopMonitoring/)
              .reply(200, fixture);

  return transit.getPredictionsForStop(12345)
                .then(result => {
                  const expected = transit.mapDataToPredictions(fixture.ServiceDelivery.StopMonitoringDelivery.MonitoredStopVisit);
                  t.deepEqual(result, expected);
                })
                .catch(error => {
                  console.log(error);
                  t.fail();
                });
});
