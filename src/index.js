import { mapHogQLToQueryResult, toQueryResult } from "./lib.js";

/**
 * @typedef {Object} ConnectorOptions
 * @property {string} appHost
 * @property {string} projectId
 * @property {string} apiKey
 * @see https://docs.evidence.dev/plugins/create-source-plugin/#options-specification
 */
export const options = {
  appHost: {
    title: "API Host",
    description: "Base URL of your PostHog instance for private endpoints.",
    type: "string",
    default: "https://us.posthog.com",
    required: true,
  },
  projectId: {
    title: "Project ID",
    description:
      "ID of the PostHog project you're trying to query data from. You can find this in Settings > Project > General.",
    type: "string",
    required: true,
  },
  apiKey: {
    title: "Personal API Key",
    description:
      "API key with access to the project and Read access to Insight/Query scope. You can create one in Settings > User > Personal API keys.",
    type: "string",
    secret: true,
    required: true,
  },
};

/**
 * Wrapper around fetch that handles retries and unsuccessful responses
 * @param {string| URL|Request} input
 * @param {RequestInit} [init]
 * @returns {Promise<Response>}
 */
const fetchWithRetries = async (input, init) => {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(input, init);

    if (response.ok) {
      return response;
    }

    // Retry on Internal Server Error and Gateway Time-out errors
    if ([500, 504].includes(response.status) && attempt < maxAttempts) {
      console.warn(`Retry attempt ${attempt} of ${maxAttempts - 1}`);
      continue;
    }

    const details = await response.text();
    throw new Error(
      `HTTP ${response.status} ${response.statusText}: ${details}`,
    );
  }
};

/** @type {import("@evidence-dev/db-commons").RunQuery<ConnectorOptions>} */
const runHogQLQuery = async (queryString, options) => {
  // Trim trailing semicolon to avoid input validation errors
  const trimmedQuery = queryString.replace(/;\s*$/, "");

  const response = await fetchWithRetries(
    `${options.appHost}/api/projects/${options.projectId}/query/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        query: {
          kind: "HogQLQuery",
          query: trimmedQuery,
        },
      }),
    },
  );

  const data = await response.json();
  return mapHogQLToQueryResult(data.results, data.types);
};

/** @type {import("@evidence-dev/db-commons").RunQuery<ConnectorOptions>} */
const getInsight = async (queryString, options) => {
  const idOrShortId = queryString.trim();

  if (!idOrShortId) {
    throw new Error("Insight ID cannot be empty");
  }

  const isId = /^\d+$/.test(idOrShortId);

  const url = isId
    ? `${options.appHost}/api/projects/${options.projectId}/insights/${idOrShortId}/?refresh=blocking`
    : `${options.appHost}/api/projects/${options.projectId}/insights/?short_id=${idOrShortId}&refresh=blocking`;

  const response = await fetchWithRetries(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.apiKey}`,
    },
  });

  const data = await response.json();

  if (isId) {
    return toQueryResult(data);
  } else {
    if (!data.results?.length) {
      throw new Error(`No insight found with short_id: ${idOrShortId}`);
    }
    return toQueryResult(data.results[0]);
  }
};

/** @type {import("@evidence-dev/db-commons").GetRunner<ConnectorOptions>} */
export const getRunner = (options) => {
  return async (queryText, queryPath) => {
    // Filter out non-sql and non-insight files
    if (queryPath.endsWith(".sql")) return runHogQLQuery(queryText, options);
    if (queryPath.endsWith(".insight")) return getInsight(queryText, options);
    return null;
  };
};

/** @type {import("@evidence-dev/db-commons").ConnectionTester<ConnectorOptions>} */
export const testConnection = async (opts) => {
  try {
    const data = await runHogQLQuery("SELECT 1", opts);
    return data.rows?.[0]?.["1"] === 1;
  } catch (e) {
    console.error(`Failed to connect: ${e.message}`);
    if (e.cause) console.error(e.cause);
    return false;
  }
};
