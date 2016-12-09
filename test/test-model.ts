import test from 'ava';
import * as fs from 'fs';

import { saveJsonDataToFile, saveArrayToSlotFile } from '../model';
import { testJsonData } from './fixture-json';

function extractObjectFromTsFile(fileName: string) {
  return JSON.parse(fs.readFileSync(fileName).toString().split('=')[1].trim());
}

test('save json data to file', t => {
  saveJsonDataToFile('out-json', testJsonData);
  // formatting will be different, compare content of JSON
  let output = extractObjectFromTsFile('./out-json.ts');
  let expected = extractObjectFromTsFile('./test/fixture-json.ts');
  t.deepEqual(JSON.stringify(output), JSON.stringify(expected));
});

test('save array to slot file', t => {
  const expected = fs.readFileSync('./test/fixture-slot.txt');
  let slotItems = expected.toString().split('\n');
  saveArrayToSlotFile('out-slot', slotItems);
  const output = fs.readFileSync('./out-slot.txt');
  t.deepEqual(output, expected);
});

test.after('cleanup', t => {
  let outputTestFiles = fs.readdirSync('./');
  outputTestFiles = outputTestFiles.filter(f => {
    return f.indexOf('out') === 0;
  });

  for (let file of outputTestFiles) {
    fs.unlinkSync(file);
  }
});
