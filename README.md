# Vue 3 PDF Component

Taking a stab at creating an up-to-date PDFJS-based Vue JS component.

This component is primarily for rendering tiles (i.e. PDF pages) in a `grid` or `flex` layout.

It is not a (full-blown) viewer, but could be used to make one.

~~~~~~
npm install pdf-component-vue
~~~~~~

[![npm version](https://badge.fury.io/js/pdf-component-vue.svg)](https://badge.fury.io/js/pdf-component-vue)
![workflow](https://github.com/escape-llc/pdf-component-vue/actions/workflows/node.js.yml//badge.svg)

![image](https://github.com/escape-llc/pdf-component-vue/assets/3513926/528e064b-de59-42a3-a872-6b68d4edf744)

![image](https://github.com/escape-llc/pdf-component-vue/assets/3513926/281a397a-0cb9-4123-95c1-5d62e5268030)

## WHY!?

Excellent question!

After using one of the existing components out there, we were left wanting more.  After reviewing the rest of the field,
we found this short list of reasons for proceeding:

* Built with an old-old-old (`2.x`) version of `pdfjs`
* Built for Vue 2
* Lacking layout control

## PDFJS

This assumes you may know a little about how `pdfjs` works; there is lots of glossing over.

You don't require any knowledge of `pdfjs` to use this control.

Uses a current build of PDFJS.

## Goals

* Be CSS-agnostic, but biased towards `grid` and `flex` treatment.
  * Allow you to control the styles used for all major layout elements.
* Have lots of `$emit` for flexibility on the consumer.
* Leverage `slot` for content injection.
* Have  "smart" page management OOTB.
* Support real-time scrolling via `IntersectionObserver`.
* Have "smart" page sizing based on containing element.

# Slots

Slots provide you places to inject content.

# Core Logic

Those familiar with `pdfjs` know there are 3 "layers" involved:

* `canvas` layer containing the page image
* `text` layer containing "searchable" PDF text
* `annotation` layer with the PDF annotations

There is also lots of bookkeeping to keep everything consistent:

* Interaction between DOM elements and `pdfjs`
  * Graphic, text, and annotation layers.
* Mounting and unmounting while live.
  * DOM elements require bookkeeping while mounted and the zone changes.
* Re-render on size changes.
  * Each rendering is fixed to the container's current size.
* "Bake in" the required CSS (via `style`) to make the layers render correctly.
  * The 3 layers must be "stacked" correctly for visual presentation.

# Page Events

* Attach handlers to receive page clicks directly, e.g. track "selected" page(s).
* Alter the CSS styling of (specific) pages (`pageContainerClass`), e.g. "highlighting" a clicked page (see demo 3).

# Scrolling

In the Continuous mode, it is important to host the component directly inside the element that provides scrolling, e.g. a `div` with `overflow` management so it has scroll bar(s).  This element is used with an `IntersectionObserver` to determine what tiles are visible.

The most common case is row-major-auto 1-column grid in `WIDTH` size mode (see below); the document container's width is used as the rendering width, and the height is calulated from that using the page's aspect ratio.  The height should be `auto` in this case.  The parent element of the document container will scroll (subject to CSS) vertically.

# Auto-sizing

Some components require you to set (one of the) dimensions (usually in pixels not CSS units) to render properly, and this is not convenient.

Rather than telling the component what size to use, the component uses the DOM elements to compute the size desired.  This allows you to set the size of the grid cells via CSS.

Sizing has two modes:

* `WIDTH` - conform the document to the width of the container element.  The height is dynamic.
* `HEIGHT` - conform the document to the height of the container element.  The width is dynamic.

In all cases, aspect ratio is preserved.

## Resizing

Because the `canvas` layer is literally a drawing of the page, it requires redrawing once the size of the page container element changes, for layout (conform to new size) resources (down size) and legibility (up size).  This is tracked and handled internally (via `ResizeObserver`).

# Grid System

Since the `grid` concept is "baked in" there is some configuration required to use it.  In return, you get convenient `slotProps` for binding to the `grid-row` and `grid-column` CSS properties in your grid layout.  This is necessary to properly position slot content in the same cell as the page's DOM elements.

The document container element should use `display:grid` and specify row and column templates, and other `grid` properties as needed.  For a finite grid, specify the overall `height` so grid track heights are defined and not `auto`.  See the demos for examples.

Once the final set of `tiles` is calculated, the grid numbering is applied.  The `tileConfiguration` is used to calculate the row and column coordinates for each tile.

If no `tileConfiguration` is given, the default is applied: the tile sequence is `grid-row`, and `grid-column` is not used (it is `undefined` and produces no CSS).

The `TileConfiguration` class provides the following features:

* Ordering row and column major.
* Fixed count in major and minor dimensions; build "finite" grids of fixed size.
* Variable count in major dimension; allow for "auto" grids.

When the grid has `auto` for the major dimension, you may use any number of pages, because it is set up to number all tiles.

When the grid is finite, that number of tiles (maximum) is always generated.

## Display Modes

Using the grid system, you have options for layout:

* Continuous - one continuous row/column of pages.  The number of tiles "visible" depends on the height of the stack currently presenting.  Use `WIDTH` mode (default) and a one-column grid (see below).
* Tileset (n-up) - display a number of tiles in a grid pattern.  Use `HEIGHT` mode and explicit grid rows and columns (see below).

These are informal based on your CSS and not an actual "mode" of the component.

# Page Management

Because documents may be gigantic, only *some of the pages* should be rendered at any point.

Page management is divided into these "zones":

* Hot - fully materialized to the DOM.
* Warm - "placeholder" pages primarily to make scrolling happen, and provide (correctly sized) space until pages go Hot.
* Cold - outside the range of Hot and Warm pages.

> The default settings make all pages `hot`, so the entire document is rendered upon loading.  This may not be appropriate for your use case.

The zones center around the Current Page or just `page`.  The Hot zone directly impacts resource consumption, because the `canvas` etc. are rendered from `pdfjs`.  This is sized to provide a smooth UX while scrolling (i.e. moving the `page` a small amount).

Each time the `page` moves, the zones are recalculated, and pages transition between zones as detected.  In particular, pages becoming `hot` are rendered.

## Invoking Page Management

The component has the `pageManagement` prop and implementations of the `PageManagement` class for you to invoke page management as necessary.

The primary goal of Page Management is to ensure the tiles visible to the user are rendered, and other tiles not rendered, in order to balance resources and performance.  See the Page Management Demo for an illustration of how this works.

It is important to note that the component has no sense of "current page" in the navigation sense; tracking this is left totally in your hands.

If you do not specify `pageManagement` prop the default is used, which labels all pages `hot` to render the entire document upon loading.

## Using Zones

If you are presenting a finite grid, it makes little sense to render pages not visible, so you should set the `hot` zone to the number of tiles.  This prevents any other pages from being loaded with `pdfjs`.  Be aware that simply accessing the page from `pdfjs` has a cost that should be minimized.

If you are in a "scrolling" scenario (e.g. a 1-column grid) then for the best control you should use an `IntersectionObserver` and invoke Page Management as needed, based on what tiles are reported as intersecting the viewport.  It is important to use the element with the scrolling, or intersection reports are not correct.

> Come up with some kind of composable for this functionality, or just bake it in.

## Changing the Start Tile

Since there is no concept of "current page" from a navigation standpoint, there must still be a way to tell the component which tile to start rendering on, and Page Management is used for this as well.  See the Tiles Demo for details; it uses the `PageManagement_Scroll` class to "page" through a finite grid of 2x3 tiles.

## Very Large Documents

So why have 3 zones?  Consider a document with 1000 pages.  The number of DOM elements for just placeholders
for every page may be too large for the user's device, so it is desirable to keep this to a reasonable number,
say 100.

What this means is that for the 1000 page document, only 100 "pages" are represented in the DOM at any point (Hot + Warm), providing enough
elements for scrolling to work.

# Thanks

* Author of `vue-pdf-embed` for inspiration https://github.com/hrynko/vue-pdf-embed/blob/master/src/vue-pdf-embed.vue