export interface BulkParseItem {
  raw: string;
  payload: Record<string, string> | string;
  isValid: boolean;
  error?: string;
}

export interface BulkParseResult {
  total: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  items: BulkParseItem[];
}

/**
 * Parses raw text input (delimited lines, single keys, or email|password pairs)
 */
export function parseBulkInventory(
  rawContent: string,
  delimiter = '|',
  expectedFields?: string[],
  requireDelimiter = false,
): BulkParseResult {
  const lines = rawContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const seen = new Set<string>();
  const items: BulkParseItem[] = [];

  let duplicateCount = 0;
  let invalidCount = 0;
  let validCount = 0;

  for (const line of lines) {
    if (seen.has(line)) {
      duplicateCount++;
      items.push({
        raw: line,
        payload: line,
        isValid: false,
        error: 'Duplicate entry in batch',
      });
      continue;
    }
    seen.add(line);

    if (line.includes(delimiter)) {
      const parts = line.split(delimiter).map((p) => p.trim());
      if (parts.some((p) => p.length === 0)) {
        invalidCount++;
        items.push({
          raw: line,
          payload: line,
          isValid: false,
          error: 'Empty field detected between delimiters',
        });
        continue;
      }

      if (expectedFields && expectedFields.length > 0) {
        if (parts.length !== expectedFields.length) {
          invalidCount++;
          items.push({
            raw: line,
            payload: line,
            isValid: false,
            error: `Expected ${expectedFields.length} fields, got ${parts.length}`,
          });
          continue;
        }

        const payloadObj: Record<string, string> = {};
        expectedFields.forEach((field, idx) => {
          payloadObj[field] = parts[idx]!;
        });

        validCount++;
        items.push({
          raw: line,
          payload: payloadObj,
          isValid: true,
        });
      } else {
        // Default pair: username/email & password
        const [first, second, ...rest] = parts;
        const payloadObj: Record<string, string> = {
          account: first!,
          password: second!,
        };
        if (rest.length > 0) {
          payloadObj.extra = rest.join(' | ');
        }

        validCount++;
        items.push({
          raw: line,
          payload: payloadObj,
          isValid: true,
        });
      }
    } else {
      if (requireDelimiter) {
        invalidCount++;
        items.push({
          raw: line,
          payload: line,
          isValid: false,
          error: `Missing required delimiter '${delimiter}'`,
        });
      } else {
        // Single code or single license string
        validCount++;
        items.push({
          raw: line,
          payload: { code: line },
          isValid: true,
        });
      }
    }
  }

  return {
    total: lines.length,
    validCount,
    duplicateCount,
    invalidCount,
    items,
  };
}
