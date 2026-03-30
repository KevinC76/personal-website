# Design System Document: High-End Editorial

## 1. Overview & Creative North Star: "The Digital Broadsheet"
The Creative North Star for this design system is **The Digital Broadsheet**. We are moving away from the "app-like" fatigue of rounded corners and soft gradients, returning instead to the authoritative, high-contrast world of traditional journalism. This system is defined by its architectural rigor, intentional asymmetry, and a reverence for white space as a structural element.

Rather than standard grids, we utilize a "Master Column" approach where content flows with varying widths, creating a rhythmic, editorial pace. We break the template look by treating every screen as a front-page layout—prioritizing the "lead story" through massive typography and secondary modules through strict, hairline-defined containment.

---

### 2. Colors: The Ink and Newsprint Palette
This system is built on the tension between `primary` (#000000) and `surface` (#fcf9f2). It is a binary world where depth is created not through shadows, but through tonal shifts in the "paper" itself.

* **Primary (#000000):** Used for all high-level typography and structural "rules" (lines). It represents the ink.
* **Surface & Containers:** We use `surface_container_low` (#f6f3ec) and `surface_container_highest` (#e5e2db) to create subtle, parchment-like shifts in background sections.
* **The "No-Line" Rule (Exceptions):** While many modern systems avoid lines, this system embraces them—but with a twist. Traditional 1px solid borders are replaced with "Rule Lines." Use `outline` (#777777) at very low opacities (20%) or the `primary` (#000000) token for intentional, high-contrast dividers that mimic a printing press's registration.
* **Surface Hierarchy:** To create depth, stack a `surface_container_lowest` (#ffffff) card on a `surface` (#fcf9f2) background. This creates a "bleached paper" effect that feels premium and tactile without using a single drop shadow.

---

### 3. Typography: The Editorial Voice
The hierarchy is built on the interplay between the authoritative **Newsreader** (Serif) and the functional **Public Sans** (Sans-Serif).

* **Display & Headlines (Newsreader):** These are the soul of the system. Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) for hero moments. This conveys a sense of breaking news and historical importance.
* **Body (Public Sans):** Used for all long-form reading. We favor `body-lg` (1rem) with a generous line-height to ensure the dense multi-column layouts remain legible and modern.
* **Labels (Work Sans):** Our "Metadata" font. Small, uppercase, and often tracking-out (+0.05em). Use `label-md` for categories, bylines, and dates.

---

### 4. Elevation & Depth: Tonal Layering
We reject the concept of "Z-space" shadows. In this system, "up" is indicated by "lighter and sharper."

* **The Layering Principle:** Instead of shadows, use background shifts. A "floating" modal should be `surface_container_lowest` (#ffffff) sitting on a `surface_dim` (#dcdad3) overlay.
* **Tactile Interaction:** For interactive states, move from `primary` to `primary_container`. It should feel like ink soaking into paper, not a light turning on.
* **The Ghost Border:** For buttons or inputs, use `outline_variant` (#c6c6c6) at 20% opacity. This provides a "pressed-in" or "engraved" look rather than a raised look.
* **Intentional Asymmetry:** Break the grid. Let a headline in a `headline-lg` style hang over the edge of a container, or use `spacing-20` on one side and `spacing-4` on the other to create a curated, non-standard layout.

---

### 5. Components: The Primitive Set

* **Buttons:**
* **Primary:** Solid `primary` (#000000) with `on_primary` (#e2e2e2) text. 0px radius. Use a subtle inner-stroke of `outline_variant` at 10% to give it a "pressed metal" tactile feel.
* **Tertiary:** No background. Underlined with a 2px `primary` rule. Hover state shifts the entire text block 2px to the right (`spacing-0.5`).
* **Cards & Lists:**
* Forbid standard dividers. Instead, use "Rule Lines" (1px `outline_variant` at 15% opacity) that only span 80% of the container width, centered.
* Use `surface_container_low` for card backgrounds to distinguish them from the main "page" (`surface`).
* **Input Fields:**
* Bottom-border only (2px `primary`). No rounded corners.
* Labels use `label-sm` in all-caps, positioned exactly `spacing-1` above the input line.
* **Editorial Columns:**
* A custom component that takes `body-md` text and splits it into a 2 or 3-column CSS grid with a "Gutter Rule" (vertical line) between them using `spacing-4` as the gap.

---

### 6. Do’s and Don’ts

**Do:**
* **Do** use 0px border radius for everything. Sharpness is a sign of precision.
* **Do** use "Inverted Hero" blocks: a full-width `primary` (#000000) section with `on_primary` (#e2e2e2) text to break up the scroll.
* **Do** use extreme typographic scale. If a headline is important, make it `display-lg`. If it’s secondary, drop it significantly to `title-sm`.

**Don’t:**
* **Don’t** use shadows. If you feel you need a shadow, use a thicker border or a darker background color shift instead.
* **Don’t** use icons unless absolutely necessary. Rely on clear, typographic labels (`label-md`).
* **Don’t** center-align long-form text. Keep it flush-left (ragged right) to maintain the broadsheet aesthetic.
* **Don’t** use 100% opaque borders for sectioning. It creates "visual noise" that competes with the high-contrast typography. Use `outline_variant` at low opacities.