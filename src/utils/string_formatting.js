"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toISOString = exports.format = exports.combine = exports.compareDates = exports.compare = exports.formatPercentage = exports.formatNum = exports.formatCurrency = void 0;
function formatCurrency(num, digits = 2, currency = "USD", currencyDisplay = "symbol", useGrouping = true) {
    const options = {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
        style: "currency",
        currency,
        currencyDisplay,
        useGrouping,
    };
    let notation = "standard";
    if (num >= 1000) {
        notation = "compact";
    }
    else if (num < 0.1 && num > 0) {
        notation = "scientific";
    }
    return Intl.NumberFormat("en-US", { notation, ...options }).format(num);
}
exports.formatCurrency = formatCurrency;
function formatNum(num, digits = 2, useGrouping = true) {
    const options = {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
        useGrouping,
    };
    let notation = "standard";
    if (num >= 1000) {
        notation = "compact";
    }
    else if (num < 0.1 && num > 0) {
        notation = "scientific";
    }
    return Intl.NumberFormat("en-US", { notation, ...options }).format(num);
}
exports.formatNum = formatNum;
function formatPercentage(num, digits = 0) {
    return Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(num);
}
exports.formatPercentage = formatPercentage;
function compare(a, b, reverse = true) {
    let comp;
    if (a !== "" && b !== "" && !isNaN(Number(a)) && !isNaN(Number(b))) {
        comp = Number(a) - Number(b);
    }
    else {
        comp = String(b).localeCompare(String(a));
    }
    return comp * (reverse ? -1 : 1);
}
exports.compare = compare;
function compareDates(a, b) {
    const aTime = new Date(a).getTime();
    const bTime = new Date(b).getTime();
    return bTime - aTime;
}
exports.compareDates = compareDates;
function combine(...criteria) {
    return (a, b) => {
        if (!criteria.length)
            return 0;
        for (let i = criteria.length - 1; i >= 0; i--) {
            const curCriteriaComparatorValue = criteria[i](a, b);
            // if the comparison objects are not equivalent, return the value obtained
            // in this current criteria comparison
            if (curCriteriaComparatorValue !== 0) {
                return curCriteriaComparatorValue;
            }
        }
        return 0;
    };
}
exports.combine = combine;
function format(template, placeholders) {
    for (const [key, placeholder] of Object.entries(placeholders)) {
        template = template.replace(new RegExp(`\\{${key}\\}`, "gi"), placeholder);
    }
    return template;
}
exports.format = format;
function toISOString(timestamp) {
    return new Date(timestamp).toISOString();
}
exports.toISOString = toISOString;
//# sourceMappingURL=string_formatting.js.map