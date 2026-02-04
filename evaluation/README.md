Here is the updated content in a clean, copyable Markdown format with the code fences removed as requested.
# Integrated Evaluation (Local Database) — How to Generate Reports

This project includes an **evaluation-enabled** Local Database integration for Newt.

When you run **push** and **query** operations from the UI, Newt prints a **structured JSON report** to the **browser DevTools Console**.

The only “setup” you do per run is:

1. **Load the map in Newt (UI)**
2. **Set the evaluation context in the Console (one small snippet)**
3. **Run the push/query from the UI**
4. **Copy the JSON report from the Console and save it**

---

## Where the output goes

All evaluation output appears in the **DevTools Console** as a single JSON object printed after each operation.

* **Open DevTools:** **F12** or **Ctrl+Shift+I** (Windows/Linux), **Cmd+Option+I** (macOS)
* **Tab:** Use the **Console** tab.

---

## Push Evaluation Workflow (Local Database)

### Step 1 — Load a map in Newt

Use the normal Newt UI to open a file:

* **File → Open…** and select a `.nwt` file (or other supported formats)
* The map will load into the canvas

**Screenshots:**

* File open flow:
* Example map after load:

---

### Step 2 — Set the push report context (Console)

Before you run the push, set the context once in the Console:

```
localStorage.setItem("NEXT_REPORT_CONTEXT", JSON.stringify({
workload: "RAF_Fragment_plasma_membrane_MERGE",
mapName: "RAF phosphorylates MEK.sbgn"
}));
```

**What this does:**

* It labels the next push report with a workload name + map name.
* The context is consumed **once** (so set it again before the next push).

> **Note:** See `evaluation_2.png` for an example of setting the context in the console.

---

### Step 3 — Run the push from the UI

Now run the push using the normal Newt menu:

1. **Database → Local → Push Active Tab Content**
2. Choose **Replace** or **Merge** when prompted

**Screenshots:**

* Selecting the push operation in the menu:
* Replace/Merge confirmation dialog:

> **Important ordering rule:**
> ✅ Set the context first → then run the push.

---

### Step 4 — Copy the report from the Console

After the push completes, the Console prints a JSON report.

**Screenshot:**

Save it by copying the printed JSON into a file like:

`RAF_Fragment_plasma_membrane_MERGE.json`

**Tip:** In Chrome/Edge DevTools you can usually right-click the logged output and choose **Copy** (or copy the JSON text directly).

---

## Query Evaluation Workflow (Local Database)

### Step 1 — Set the query report context (Console)

Before you run a query (Common Stream / Neighborhood / Paths, etc.), set:

```
localStorage.setItem("NEXT_QUERY_REPORT_CONTEXT", JSON.stringify({
workload: "W5_D6_dtmp[c]_dump[c]_duri[c]_LL1",
mapName: "Minerva(22706,24628).sbgn",
queryName: "CommonStream",
runId: "LL1_noClone"
}));
```

**What this does:**

* It labels the next query report with workload/map/query/run identifiers.
* This context is also consumed **once** (set it again before the next query).

---

### Step 2 — Run the query from the UI

Use the normal UI under:

1. **Database → Local → (choose a query, e.g. Common Stream / Neighborhood / Paths…)**
2. Fill out the query dialog as usual (labels, limits, direction, etc.).

When it completes, the results render to the canvas and a report prints to the Console.

---

### Step 3 — Copy the query report from the Console

Copy/paste the JSON report into a file like:

`W5_D6_dtmp[c]_dump[c]_duri[c]_LL1_CommonStream_LL1_noClone.json`

---

## What the reports contain

### Push report

* **Workload + map name** (from `NEXT_REPORT_CONTEXT`)
* **Mode used** (Replace vs Merge)
* **Timings** (preprocessing, push time, total)
* **Incoming vs processed counts** (nodes/edges)
* **Edge hygiene** (invalid edges dropped, self-loops dropped, etc.)
* **DB snapshots** (before/after node & relationship totals)

### Query report

* **Workload + map name + query name + run id** (from `NEXT_QUERY_REPORT_CONTEXT`)
* **Timings** (seed lookup, DB query time, postprocess, render, total)
* **Result sizes** (unique nodes/edges returned)

---

## Notes & Troubleshooting

* **Context must be set before the operation:** If you run a push/query without setting context first, the report may use defaults.
* **Context is one-time use:** Each context is consumed after a single push/query.
* **Reports are browser-local:** The context is stored in `localStorage`, so it persists across refreshes.
* **Manual Reset:** You can remove the keys in the Console:
localStorage.removeItem("NEXT_REPORT_CONTEXT")
localStorage.removeItem("NEXT_QUERY_REPORT_CONTEXT")

---

## Screenshot Index

* **evaluation_1.png** — Example of opening DevTools / browser menu
* **evaluation_2.png** — Setting NEXT_REPORT_CONTEXT in the Console
* **evaluation_3.png** — Newt: File → Open…
* **evaluation_4.png** — Map loaded
* **evaluation_5.png** — Database → Local → Push Active Tab Content
* **evaluation_6.png** — Replace/Merge dialog
* **evaluation_7.png** — Final report printed in Console
