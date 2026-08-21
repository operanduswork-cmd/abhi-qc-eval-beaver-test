# Diagrams

Five diagrams for the walkthrough. Each one explains a decision that reverses an obvious
instinct — the reason the build is not naive.

Rendered with the Mermaid CLI. Sources are the `.mmd` files; re-render with:

```bash
PUPPETEER_EXECUTABLE_PATH="<a chromium binary>" \
npx @mermaid-js/mermaid-cli -i diagrams/01-pipeline.mmd -o diagrams/01-pipeline.png \
  -w 1500 -b white -c ~/.claude/skills/mermaid-diagram/assets/clean-blue-theme.json
```

Colour is doing work in all five, and consistently:

| colour | means |
|---|---|
| green | happens in CODE — deterministic, no model involved |
| blue | a model call |
| purple | the decision that reverses the obvious instinct |
| amber | data, or a rule quoted verbatim |
| red | the failure path |

| file | the point it makes |
|---|---|
| `01-pipeline` | One fact pass settles global facts, instead of twelve independent votes on the same question. Dimensions are grouped by score enum so the transcript stays cached — coaching pays 4 cache misses, not 12. D12 is scored last because its inputs are the other dimensions' outcomes. Verification and arithmetic are green: they never touch the model. |
| `02-three-state-cap` | Caps have three states, not two. Every cap is asked as an enumeration — "list EVERY instance, empty array if none" — never as a negative, so code computes absence rather than the model asserting it. `coaching-01` books a call at L188 and walks it back at L193; a boolean cannot express that call. And an errored fact pass returns empty arrays, so "we did not look" must never resolve to "it is not there". |
| `03-evidence-rule` | The obvious way — check the quote against the line the model cited — floors a dimension on any off-by-one, which is a false negative in the direction that looks like diligence. So the quote is searched across the whole transcript and the line is derived in code. Minimum 8 words, because 8-word spans are 99.7–100% unique per transcript and 3-word only 87–94%. |
| `04-talkshare-interval` | Both rubrics phrase talk-share caps in TIME. No transcript has a timestamp. Rather than quietly substitute word share, the speaking-rate ratio is bounded and an interval published; the cap fires only if the whole interval clears the threshold. `kickoff-02` is 73.1% by word — which trips a 70% cap — and 69.4–75.1% by time, which straddles it. |
| `05-run-lifecycle` | The four states, and the two brief constraints they exist to satisfy: POST returns an id without awaiting the model so the tab can be closed, and a run whose heartbeat stops for 120s is swept on read into a failure that says how many dimensions landed and how long ago. A dead run is re-runnable on the same id, so a link already shared starts working rather than a second URL appearing. |
