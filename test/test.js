import fetchMock from 'fetch-mock';
import jps from '../src/index.js';

fetchMock.config.overwriteRoutes = false;

const queryString = '銅獅子鎮柄香炉';

jest.useFakeTimers();

test('lookup builders', () => {
  [
    'findRS',
  ].forEach(async (uriBuilderMethod) => {
    const results = await jps[uriBuilderMethod](queryString);
    expect(results.length > 0).toBe(true);
  });
});
