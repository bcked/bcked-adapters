type Notation = "standard" | "scientific" | "engineering" | "compact" | undefined;

export function formatCurrency(
    num: number,
    digits = 2,
    currency = "USD",
    currencyDisplay = "symbol",
    useGrouping = true
): string {
    const options = {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
        style: "currency",
        currency,
        currencyDisplay,
        useGrouping,
    };
    let notation: Notation = "standard";
    if (num >= 1000) {
        notation = "compact";
    } else if (num < 0.1 && num > 0) {
        notation = "scientific";
    }
    return Intl.NumberFormat("en-US", { notation, ...options }).format(num);
}

export function formatNum(num: number, digits = 2, useGrouping = true): string {
    const options = {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
        useGrouping,
    };
    let notation: Notation = "standard";
    if (num >= 1000) {
        notation = "compact";
    } else if (num < 0.1 && num > 0) {
        notation = "scientific";
    }
    return Intl.NumberFormat("en-US", { notation, ...options }).format(num);
}

export function formatPercentage(num: number, digits = 0): string {
    return Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(num);
}

export function compare<T extends number | string>(a: T, b: T, reverse = true): number {
    let comp;
    if (a !== "" && b !== "" && !isNaN(Number(a)) && !isNaN(Number(b))) {
        comp = Number(a) - Number(b);
    } else {
        comp = String(b).localeCompare(String(a));
    }
    return comp * (reverse ? -1 : 1);
}

export function compareDates(a: string, b: string): number {
    const aTime = new Date(a).getTime();
    const bTime = new Date(b).getTime();
    return bTime - aTime;
}

type CompareFunction<T> = (a: T, b: T) => number;
export function combine<T>(...criteria: CompareFunction<T>[]) {
    return (a: T, b: T): number => {
        if (!criteria.length) return 0;

        for (let i = criteria.length - 1; i >= 0; i--) {
            const curCriteriaComparatorValue = criteria[i]!(a, b);
            // if the comparison objects are not equivalent, return the value obtained
            // in this current criteria comparison
            if (curCriteriaComparatorValue !== 0) {
                return curCriteriaComparatorValue;
            }
        }
        return 0;
    };
}

export function format(template: string, placeholders: Record<string, string>): string {
    for (const [key, placeholder] of Object.entries(placeholders)) {
        template = template.replace(new RegExp(`\\{${key}\\}`, "gi"), placeholder);
    }
    return template;
}

export function toISOString(timestamp: Date | number): primitive.ISODateTimeString {
    return new Date(timestamp).toISOString() as primitive.ISODateTimeString;
}
