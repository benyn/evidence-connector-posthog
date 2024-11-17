import { EvidenceType } from "@evidence-dev/db-commons";

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
