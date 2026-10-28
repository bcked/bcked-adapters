"""Checks extracted BUSD sections against the reported subtotals (or the total, if there are no subtotals)."""
import json, sys
data = json.load(open(sys.argv[1]))
problems = 0
for r in data:
    if not r["sections"]:
        problems += 1; print("NO DATA", r["file"]); continue
    for s in r["sections"]:
        cat, sub = s["cat"], s.get("subtotals") or {}
        checks = []
        if sub:
            if "rwa:USTB" in sub: checks.append(("bills", cat.get("rwa:USTB", 0), sub["rwa:USTB"]))
            if "debt" in sub: checks.append(("debt", cat.get("rwa:USTBOND", 0) + cat.get("rwa:USTNOTE", 0), sub["debt"]))
            if "rwa:USD" in sub: checks.append(("usd", cat.get("rwa:USD", 0), sub["rwa:USD"]))
        else:
            checks.append(("total", sum(cat.values()), s["total"]))
        for name, got, want in checks:
            if abs(got - want) > 10:
                problems += 1; print("MISMATCH", s["date"], name, f"{got:,.0f}", f"{want:,.0f}")
        if sub and abs(sum(cat.values()) - s["total"]) > 10:
            print("NOTE report total differs from its subtotals", s["date"], f"{sum(cat.values()) - s['total']:,.0f}")
print("sections", sum(len(r["sections"]) for r in data), "problems", problems)
