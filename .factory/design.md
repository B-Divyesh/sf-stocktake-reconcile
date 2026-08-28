# Stocktake Reconcile — visual thesis

## Direction: handwritten lab notebook

Stock reconciliation is a careful physical observation followed by a defensible correction. The interface feels like a well-kept stockroom ledger: warm paper, graphite marks, measured rules and a clipped inspection card, rather than a generic dashboard. This makes count data feel reviewable and human without sacrificing the precision of a table.

## System

- **Light palette:** `#f6f0df` field paper, `#fffaf0` lifted paper, `#25251e` graphite, `#655f52` pencil-muted, `#0c6254` ledger green, `#d86e3d` mark-orange, `#8d352b` correction red, `#e3bf4c` caution ochre. The dark theme is an ink desk: `#1c211f`, `#262c28`, `#f1ead9`, `#c6c0b0` with a brighter ledger green. All primary text/background combinations exceed 4.5:1.
- **Type:** `Georgia` provides a familiar ledger-heading voice; `ui-monospace, SFMono-Regular, Menlo, Consolas` supplies clear, tabular count data. Both are local system stacks, so no remote font is loaded.
- **Spacing:** an 8px cadence (8, 16, 24, 32, 48, 64); lightly irregular dashed rules only separate related work, never frame every element.
- **Interaction grammar:** import is a stamped receipt, rows are inspection entries, editing a count recalculates its adjacent variance immediately, and a material variance gets a visible reason line. The signed report has a wax-seal-like hash stamp.
- **Motion:** a 180ms opacity/transform settle for imported rows and notices. `prefers-reduced-motion` removes transforms and transitions entirely. No decorative looping motion.

## Original imagery

Art direction prompt sheet: a top-down still life of a small stockroom count notebook, a brass scale, graphite pencil, parcel tags and a neat ruler on warm cream paper; flat editorial illustration with hand-inked crosshatching, muted ledger green, terracotta and ochre; gentle morning side light; ample negative space; no people, text, logos, watermark, brands, UI screenshots, distorted objects, or unnecessary symbols.

The landing illustration was generated with the factory Azure `factory-image` deployment on 2026-08-28 from that prompt, inspected for unwanted text and artifacts, then converted to WebP. It is original generated artwork for Stocktake Reconcile and is disclosed in the landing footer. Its source prompt is recorded in `assets/src/notebook-hero.json`.

## Responsive intent

On phones, the brief ledger summary and file action stack before the table; each table row becomes a labelled count sheet so units and reasons remain visible. The desktop view retains the dense audit grid. The artwork is hidden on narrow screens because the work, not the decoration, is primary.
