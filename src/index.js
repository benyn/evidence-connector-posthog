import { EvidenceType, TypeFidelity } from "@evidence-dev/db-commons";
import { postHogTypeToEvidenceType } from "./lib.js";

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
      "API key with access to the project and Read access to Query scope. You can create one in Settings > User > Personal API keys.",
    type: "string",
    secret: true,
    required: true,
  },
};

/** @type {(options: ConnectorOptions, query: string) => Promise<Response>} */
const createQuery = async (options, query) => {
  const url = `${options.appHost}/api/projects/${options.projectId}/query/`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${options.apiKey}`,
  };

  const payload = {
    query: {
      kind: "HogQLQuery",
      query: query,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `${response.status} ${response.statusText}: ${await response.text()}`,
    );
  }

  const data = await response.json();
  return data;
};

/**
 * Maps a PostHog query result to an object with column names as keys
 * @param {Record<string, unknown>} result
 * @param {[string, string][]} types
 * @returns {Record<string, unknown>}
 */
const mapRowToObject = (result, types) => {
  const standardized = {};
  for (let i = 0; i < types.length; i++) {
    standardized[types[i][0]] = types[i][1].startsWith("DateTime")
      ? new Date(result[i])
      : result[i];
  }
  return standardized;
};

/**
 * Maps a PostHog query type to an Evidence column type
 * @param {[string, string]} type
 * @returns {import('@evidence-dev/db-commons').ColumnDefinition}
 */
const mapTypeToEvidenceColumnType = (type) => {
  const mappedType = postHogTypeToEvidenceType(type[1]);
  return {
    name: type[0],
    evidenceType: mappedType ?? EvidenceType.STRING,
    typeFidelity: mappedType ? TypeFidelity.PRECISE : TypeFidelity.INFERRED,
  };
};

/** @type {import("@evidence-dev/db-commons").RunQuery<ConnectorOptions>} */
const runQuery = async (queryString, database) => {
  // Trim trailing semicolon to avoid input validation errors
  const trimmedQueryString = queryString.replace(/;\s*$/, "");

  const data = await createQuery(database, trimmedQueryString);

  const output = {
    rows: data.results.map((result) => mapRowToObject(result, data.types)),
    columnTypes: data.types.map((type) => mapTypeToEvidenceColumnType(type)),
    expectedRowCount: data.results.length,
  };

  return output;
};

/**
 * Implementing this function creates a "file-based" connector
 *
 * Each file in the source directory will be passed to this function, and it will return
 * either an array, or an async generator {@see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function*}
 * that contains the query results
 *
 * @see https://docs.evidence.dev/plugins/create-source-plugin/
 * @type {import("@evidence-dev/db-commons").GetRunner<ConnectorOptions>}
 */
export const getRunner = (options) => {
  return async (queryText, queryPath) => {
    // Filter out non-sql files
    if (!queryPath.endsWith(".sql")) return null;
    return runQuery(queryText, options);
  };
};

/** @type {import("@evidence-dev/db-commons").ConnectionTester<ConnectorOptions>} */
export const testConnection = async (opts) => {
  try {
    const data = await createQuery(opts, "SELECT 1");
    return data.results?.[0]?.[0] === 1;
  } catch (e) {
    console.error(`Failed to connect: ${e.message}`);
    if (e.cause) console.error(e.cause);
    return false;
  }
};
