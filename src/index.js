const findRS = (queryString) => callJps(getRSLookupURI(queryString), queryString, "RS");

const getRSLookupURI = (queryString) => getEntitySourceURI(queryString, null);

// note that this method is exposed on the npm module to simplify testing,
// i.e., to allow intercepting the HTTP call during testing, using sinon or similar.
const getEntitySourceURI = (queryString, type) => {
  // the wdk used below, actually uses the jps php api



  const LIMIT = 200;

  const url = `https://jpsearch.go.jp/api/item/search/jps-cross?keyword=${encodeURIComponent(queryString)}&size=${LIMIT}`

  return url
};

const labels = {
  "organization": {

  },
  "database": {}
}

const generateCitation = async (common) => {

  const data = {
    author: (common.contributor || []).join(", "),
    title: common.title,
    provider: common.provider,
    database: common.database
  }

  if (!labels.organization[data.provider]) {
    const url = `https://jpsearch.go.jp/api/organization/${data.provider}`

    const response = await fetchWithTimeout(url).catch((error) => {
      return error;
    });

    const responseJson = await response.json();

    labels.organization[data.provider] = responseJson.name?.ja || data.provider
  }

  if (!labels.database[data.database]) {
    const url = `https://jpsearch.go.jp/api/database/${data.database}`

    const response = await fetchWithTimeout(url).catch((error) => {
      return error;
    });

    const responseJson = await response.json();

    labels.database[data.database] = responseJson.name?.ja || data.provider
  }

  data.provider = labels.organization[data.provider]
  data.database = labels.database[data.database]

  return `${data.author}『${data.title}』(${data.provider}所蔵)「${data.database}」収録`
}

const callJps = async (url, queryString, nameType) => {
  const response = await fetchWithTimeout(url).catch((error) => {
    return error;
  });

  //if status not ok, through an error
  if (!response.ok)
    throw new Error(
      `Something wrong with the call to Jps, possibly a problem with the network or the server. HTTP error: ${response.status}`
    );

  const responseJson = await response.json();

  const results = []

  for (const item of responseJson.list) {
    const id = item.id;
    const common = item.common;
    const uriForDisplay = `https://jpsearch.go.jp/api/item/${id}`;
    const uri = `https://jpsearch.go.jp/item/${id}`
    const citation = await generateCitation(common);

    results.push({
      nameType,
      id,
      uriForDisplay,
      uri,
      name: common.title,
      repository: 'jps',
      originalQueryString: queryString,
      image: common.thumbnailUrl ? common.thumbnailUrl[0] : '',
      description: common.description ? common.description : '',
      citation,
    })
  }

  return results;
};

/*
     config is passed through to fetch, so could include things like:
     {
         method: 'get',
         credentials: 'same-origin'
    }
*/
const fetchWithTimeout = (url, config = {}, time = 30000) => {
  /*
        the reject on the promise in the timeout callback won't have any effect, *unless*
        the timeout is triggered before the fetch resolves, in which case the setTimeout rejects
        the whole outer Promise, and the promise from the fetch is dropped entirely.
    */

  // Create a promise that rejects in <time> milliseconds
  const timeout = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject('Call to Jps timed out');
    }, time);
  });

  // Returns a race between our timeout and the passed in promise
  return Promise.race([fetch(url, config), timeout]);
};

export default {
  findRS,
  getRSLookupURI,
  fetchWithTimeout,
};
