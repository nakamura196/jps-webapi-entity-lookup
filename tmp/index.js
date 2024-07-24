import jps from '../src/index.js';
import fs from 'fs/promises';

const queryString = '上野庄';

const results = await jps.findRS(queryString)

await fs.writeFile('./tmp.json', JSON.stringify(results, null, 2)); // Save in a r