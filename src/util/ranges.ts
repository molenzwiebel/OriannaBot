/*
 * Represents a `(total) < value` range.
 */
export interface LtRange {
    type: "lt";
    value: number;
    total: boolean;
}

/**
 * Represents a `(total) > value` range.
 */
export interface GtRange {
    type: "gt";
    value: number;
    total: boolean;
}

/**
 * Represents a `(total) minimum <= value < maximum` range.
 */
export interface Range {
    type: "range";
    minimum: number;
    maximum: number;
    total: boolean;
}

/**
 * Represents a `Top value` range.
 */
export interface TopRange {
    type: "top";
    value: number;
}

/**
 * Represents any valid range that can be specified in the interface.
 */
export type NumberRange = LtRange | GtRange | Range | TopRange;

/**
 * Parses the specified range into a NumberRange object. Throws if
 * the range is not a recognized range.
 */
export default function parseRange(range: string): NumberRange {
    // < xx.
    let match = /^\s*(total)?\s*(<\s*((?:\d+)(?:\.\d+)?\s*(?:k|m|thousand|million)?))/i.exec(range);
    if (match) {
        return { type: "lt", value: parseNumber(match[3]), total: !!match[1] };
    }

    // > xx.
    match = /^\s*(total)?\s*(>\s*((?:\d+)(?:\.\d+)?\s*(?:k|m|thousand|million)?))/i.exec(range);
    if (match) {
        return { type: "gt", value: parseNumber(match[3]), total: !!match[1] };
    }

    // Top xx.
    match = /^\s*(?:[Tt][Oo][Pp]\s*(\d+))/.exec(range);
    if (match) {
        // No need to use parseNumber here since we allow integers only.
        return { type: "top", value: +match[1] };
    }

    // xx - yy.
    match = /^\s*(total)?\s*(?:((?:\d+)(?:\.\d+)?\s*(?:k|m|thousand|million)?)\s*(?:-|to|until)\s*((?:\d+)(?:\.\d+)?\s*(?:k|m|thousand|million)?))/i.exec(range);
    if (match) {
        return { type: "range", minimum: parseNumber(match[2]), maximum: parseNumber(match[3]), total: !!match[1] };
    }

    throw new Error("Don't know how to parse '" + range + "' as a range.");
}

/**
 * Parses the specified string as a number, keeping track of decimals and
 * k, m, thousand and million suffixes. 1.2k -> 1200, 3.2m -> 3200000.
 */
function parseNumber(str: string): number {
    str = str.toLowerCase().replace(/\s/g, "");

    // parseFloat is used because parseFloat("3.3k") === 3.3, not NaN like +"3.3k" gives.
    if (str.indexOf("k") !== -1 || str.indexOf("thousand") !== -1) {
        return parseFloat(str) * 1000;
    }

    if (str.indexOf("m") !== -1 || str.indexOf("million") !== -1) {
        return parseFloat(str) * 1000000;
    }

    // It is technically possible for a user to specify something stupid like
    // > 12345.6 points, but oh well ¯\_(ツ)_/¯.
    return parseFloat(str);
}