"""Checks report dates that are newer than the latest row of a backing.csv before they are written.

Usage: python3 check_new.py <extracted.json> <backing.csv>

Every new section must have a total, and the sum of its categories must be between 99% and 110% of
it (reserves can exceed the tokens outstanding). Exits with code 1 otherwise, so an unexpected report
layout fails the workflow instead of writing wrong data. Run it before convert_prices.py, while all
categories are still in the unit of the total.
"""
import csv
import json
import sys


def main(extracted, backing):
    with open(backing) as f:
        latest = max((row["timestamp"] for row in csv.DictReader(f)), default="")
    problems, new = [], 0
    for report in json.load(open(extracted)):
        for section in report["sections"]:
            if section["timestamp"] <= latest:
                continue
            new += 1
            total, value = section.get("total"), sum(section["cat"].values())
            if not total:
                problems.append(f"{section['date']}: no total in {report['file']}")
            elif not 0.99 <= value / total <= 1.10:
                problems.append(f"{section['date']}: categories sum to {value:,.2f}, total is {total:,.2f} ({report['file']})")
            else:
                print(f"{section['date']}: {value / total:.4f} of total", file=sys.stderr)
    for problem in problems:
        print(problem, file=sys.stderr)
    print(f"{new} new report dates after {latest or 'the start'}, {len(problems)} problems", file=sys.stderr)
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main(*sys.argv[1:3])
