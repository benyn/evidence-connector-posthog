import { EvidenceType, TypeFidelity } from "@evidence-dev/db-commons";

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

/**
 * Transforms PostHog data into an Evidence QueryResult
 * @param {Record<string, unknown>[]} results
 * @param {[string, string][]} types
 * @returns {import('@evidence-dev/db-commons').QueryResult}
 */
export const toQueryResult = (results, types) => ({
  rows: results.map((result) => mapRowToObject(result, types)),
  columnTypes: types.map((type) => mapTypeToEvidenceColumnType(type)),
  expectedRowCount: results.length,
});
