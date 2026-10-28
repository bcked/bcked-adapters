# bcked records

Data branch of [bcked-adapters](https://github.com/bcked/bcked-adapters). It only holds the collected
records (`assets/*/records`, `entities/*/records`, `systems/*/records`). The code lives on `main`.

The crawler workflow checks out `main` and this branch side by side, copies the records into the
code checkout, runs the adapters and commits the updated records back here. The API workflow reads
the records the same way to build api.bcked.com.
