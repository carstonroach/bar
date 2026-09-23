# The drinks collection

A phone-friendly, dependency-free guest menu for GitHub Pages. Beer, wine, liquor, and non-alcoholic drinks are grouped by class. No accounts or visitor tracking.

## Current state

Live at https://carstonroach.github.io/bar/. The inventory contains 39 foreground bottles identified from four owner-provided photos on September 23, 2026: 29 spirits/liqueurs and 10 wine-based drinks (including vermouth). No beer or non-alcoholic drinks were shown. Photos and background objects are not published.

Product descriptions and paraphrased tasting profiles link to producer, importer, retailer, or reviewer references. They are not tasting assessments of these particular opened bottles. ABVs are taken from readable labels or published product specifications; unresolved bottle-specific details are visibly flagged. Missing ABVs are deliberately omitted rather than guessed. Vintages are included only when readable.

Pending label checks: Vincenzi white chocolate expression/ABV; J. L. Quinson 2023 ABV; Thousand Lives 2022 ABV; Maria Jola ABV; Ercole vintage/ABV; Campari and Hendrick’s market-specific ABV; Midori production country. Kirkland Prosecco Rosé vintage and High West release year are not transcribed because they are not sufficiently legible. Partially hidden background bottles are excluded.

Optional fields: `description` for production/serving details, `confirmation` for an unresolved label question, `abvUnconfirmed: true` for a provisional published strength, and `sources` as an array of `{ "label": "Product reference", "url": "https://..." }`. Only HTTPS reference links are accepted. `catalogNote` provides the top-level provenance statement.

## Update the collection

Edit `guest-drinks/inventory.json` and commit the change. Use `updatedAt` as the actual inventory update date in `YYYY-MM-DD` format. Every item needs a unique `id`, a `name`, `type`, `class`, and boolean `available`.

Example only, not a claim about your collection:

```json
{
  "updatedAt": "2026-09-23",
  "drinks": [
    {
      "id": "example-gin",
      "name": "Your bottle's name",
      "type": "liquor",
      "class": "Gin",
      "available": true,
      "producer": "Optional producer",
      "origin": "Optional region or country",
      "abv": 40,
      "notes": "Optional tasting or serving notes"
    }
  ]
}
```

Allowed types: `beer`, `wine`, `liquor`, `non-alcoholic`. Classes are freely editable, such as Whiskey, Gin, Vodka, Rum, Tequila, Mezcal, Brandy, Liqueurs, Red wine, White wine, Sparkling wine, Lager, IPA, Alcohol-free beer, or Soft drinks. Use consistent spelling to group items together. ABV is optional; enter an accurate number, including 0 for drinks verified at 0%. Non-alcoholic products may have trace alcohol, so use the label's actual value. Do not assume zero.

Set `available` to `false` to hide a finished bottle without deleting it. Updating the website requires committing and deploying the inventory; it does not track consumption automatically. Open pages check for a newer inventory every minute and when visitors return to the tab. Hosting caches can delay newly published updates.

## Publish

The included workflow is for a repository that does not already have another GitHub Pages site. **Review existing Pages settings and workflows before adding it**, because a repository has one Pages deployment and this workflow publishes only `guest-drinks`. If there is already a site, integrate the menu as a subdirectory into that site's existing deployment instead. Preserve all existing repository content.

For a dedicated repository: place these files at its root, adjust the workflow branch if it is not `main`, and select GitHub Actions as the Pages source in repository Settings > Pages. The workflow publishes on changes to the menu. Verify the resulting public URL without signing in before generating the QR code. Reuse that same URL for future inventory changes so the printed code remains valid.

## Local preview

From this folder run `python3 -m http.server 8000 --directory guest-drinks`, then open `http://localhost:8000`. Use an HTTP server; opening the HTML directly from disk will not reliably load the JSON.

The menu uses textContent for inventory values, so bottle names and notes are rendered as text rather than HTML. Invalid inventory preserves the last successfully displayed list and reports the refresh failure. There are no third-party assets or runtime dependencies.
