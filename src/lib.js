import { EvidenceType, TypeFidelity } from "@evidence-dev/db-commons";
import { toDateInTimezone } from "./utils.js";

/** @type {(dataType: string) => EvidenceType} */
export const postHogTypeToEvidenceType = (dataType) => {
  switch (dataType) {
    case "Bool":
      return EvidenceType.BOOLEAN;
    case "UInt8":
    case "UInt16":
    case "UInt32":
    case "UInt64":
    case "Int8":
    case "Int16":
    case "Int32":
    case "Int64":
    case "Float32":
    case "Float64":
      return EvidenceType.NUMBER;
    case "String":
    case "UUID":
    case "LowCardinality(String)":
      return EvidenceType.STRING;
    default:
      if (dataType.startsWith("DateTime")) {
        return EvidenceType.DATE;
      }
      if (dataType.startsWith("Nullable(")) {
        return postHogTypeToEvidenceType(dataType.slice(9, -1));
      }
      return undefined;
  }
};

/**
 * Maps a PostHog row result to an object with column names as keys
 * @param {Record<string, unknown>} result
 * @param {[string, string][]} types
 * @returns {Record<string, unknown>}
 */
const mapRowToObject = (result, types) => {
  const standardized = {};
  for (let i = 0; i < types.length; i++) {
    const [name, type] = types[i];
    const value = result[i];
    standardized[name] =
      // Handle both nullable and non-nullable DateTime types
      type.includes("DateTime") && value !== null ? new Date(value) : value;
  }
  return standardized;
};

/**
 * Maps a PostHog query type to an Evidence column type
 * @param {[string, string]} type
 * @returns {import('@evidence-dev/db-commons').ColumnDefinition}
 */
const mapTypeToEvidenceColumnType = ([name, type]) => {
  const mappedType = postHogTypeToEvidenceType(type);
  return {
    name: name,
    evidenceType: mappedType ?? EvidenceType.STRING,
    typeFidelity: mappedType ? TypeFidelity.PRECISE : TypeFidelity.INFERRED,
  };
};

/**
 * Transforms PostHog HogQL query results into an Evidence QueryResult
 * @param {Record<string, unknown>[]} results
 * @param {[string, string][]} types
 * @returns {import('@evidence-dev/db-commons').QueryResult}
 */
export const mapHogQLToQueryResult = (results, types) => ({
  rows: results.map((result) => mapRowToObject(result, types)),
  columnTypes: types.map((type) => mapTypeToEvidenceColumnType(type)),
  expectedRowCount: results.length,
});

/**
 * Transforms PostHog Trends insight data into an Evidence QueryResult
 * @param {Record<string, unknown>[]} result
 * @param {string} timezone
 * @returns {import('@evidence-dev/db-commons').QueryResult}
 */
export const mapTrendsToQueryResult = (result, timezone) => {
  const rows = [];
  for (let i = 0; i < result.length; i++) {
    const seriesResult = result[i];
    for (let j = 1; j < seriesResult.data?.length; j++) {
      rows.push({
        series: seriesResult.label,
        label: seriesResult.labels?.[j],
        date: seriesResult.days?.[j]
          ? toDateInTimezone(seriesResult.days[j], timezone)
          : null,
        value: seriesResult.data?.[j],
      });
    }
  }

  return {
    rows,
    columnTypes: [
      {
        name: "series",
        evidenceType: EvidenceType.STRING,
        typeFidelity: TypeFidelity.PRECISE,
      },
      {
        name: "label",
        evidenceType: EvidenceType.STRING,
        typeFidelity: TypeFidelity.PRECISE,
      },
      {
        name: "date",
        evidenceType: EvidenceType.DATE,
        typeFidelity: TypeFidelity.PRECISE,
      },
      {
        name: "value",
        evidenceType: EvidenceType.NUMBER,
        typeFidelity: TypeFidelity.PRECISE,
      },
    ],
    expectedRowCount: rows.length,
  };
};

/**
 * Transforms PostHog insights into Evidence QueryResults
 * @param {Record<string, unknown>} insight - PostHog insight data containing results and metadata
 * @returns {import('@evidence-dev/db-commons').QueryResult}
 */
export const toQueryResult = (insight) => {
  switch (insight.query?.source?.kind) {
    case "HogQLQuery":
      return mapHogQLToQueryResult(insight.result, insight.types);
    case "TrendsQuery":
      return mapTrendsToQueryResult(insight.result, insight.timezone);
    default:
      throw new Error(
        `Unsupported insight kind: ${insight.query?.source?.kind}`,
      );
  }
};
