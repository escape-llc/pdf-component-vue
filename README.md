# Vue 3 PDF Component

`pdf-component-vue` is an up-to-date PDFJS-based Vue JS component, primarily for rendering tiles (i.e. PDF pages) in a `grid` layout.

It is not a (full-blown) viewer, but could be used to make one.

~~~~~~
npm install pdf-component-vue
~~~~~~

[![npm version](https://badge.fury.io/js/pdf-component-vue.svg)](https://badge.fury.io/js/pdf-component-vue)
[![npm dl](https://img.shields.io/npm/dm/pdf-component-vue)](https://npmjs.com/package/pdf-component-vue)
![workflow](https://github.com/escape-llc/pdf-component-vue/actions/workflows/node.js.yml//badge.svg)
![e2e](https://github.com/escape-llc/pdf-component-vue/actions/workflows/playwright.yml//badge.svg)
![codeql](https://github.com/escape-llc/pdf-component-vue/actions/workflows/github-code-scanning/codeql/badge.svg)
[![license](https://img.shields.io/npm/l/pdf-component-vue)](https://github.com/escape-llc/pdf-component-vue/blob/main/LICENSE)

## Features

A growing feature list to accommodate your use cases, especially if you want to control resources and DOM size.

* Based on v3 `pdfjs-dist`.
* Tailored for `grid` treatment.
  * Control CSS classes for all major layout elements.
  * Control row and column numbering of page cells.
* Use `slot` for content injection.
  * Arbitrary content before/after page cell, e.g. page number.
  * Arbitrary content in the page cell.
* Lots of `$emit` for flexibility on the consumer.
  * Pass through of key `pdfjs` events.
  * Navigation: PDF Link and Page cell clicks.
  * Loading and rendering status.
  * Visible pages (when scrolling is configured).
  * Resize (when resize is configured).
* "Smart" auto-sizing based on containing element.
  * Specify "width" or "height" mode.
  * Use CSS to size page cells.
* Display PDF layers: canvas, text, annotation.
* Render via `OffscreenCanvas` and `requestAnimationFrame` for smooth updates.
* DPI-aware: automatically scales up canvas to avoid blurriness.
* Integrated support for PDF page labels; show up in `slotProps`.
* Utility functions to work with PDF Outline, e.g. Table of Contents.
  * Does the dirty work of "resolving" page numbers from the arcane `dest` field.
  * Take the result and plug into your favorite Tree View!
* "Smart" page management to control resource consumption.
  * Offscreen pages may have their elements unmounted to save DOM resources.
  * Placeholder pages do not use a `canvas` to save even more resources.
* Just-in-time page rendering while scrolling via `IntersectionObserver`.
* Re-render PDF layers on size changes via `ResizeObserver`.
* Interact with the component without having a `ref`.
  * Everything works with (reactive) props and emits.
* Commanding support.
  * OOTB commands for print and go to page.
  * Framework for making your own custom commands.

## Demo Pages
The demo app that is part of the repo presents some common use cases.  Below are sample screen captures.

### Faux Viewer Demo
![image](https://github.com/escape-llc/pdf-component-vue/assets/3513926/528e064b-de59-42a3-a872-6b68d4edf744)

### Tile Navigation Demo
![image](https://github.com/escape-llc/pdf-component-vue/assets/3513926/281a397a-0cb9-4123-95c1-5d62e5268030)

### Page Management Demo
![image](https://github.com/escape-llc/pdf-component-vue/assets/3513926/1eabe935-182b-4288-9e82-de53274dd1a2)

## WHY!?

Excellent question!

After using one of the existing components out there, we were left wanting more.  After reviewing the rest of the field,
we found this short list of reasons for proceeding:

* Built with an old-old-old (`2.x`) version of `pdfjs`
* Built for Vue 2
* Do not leverage Vue's DOM management via reactivity and the component's `template`
* Lack layout control

## PDFJS

This assumes you may know a little about how `pdfjs` works; there is lots of glossing over.

You don't require any knowledge of `pdfjs` to use this control.

Uses the current build of `pdfjs` v3.

[This link](https://pdfjs.express/blog/how-pdf-js-works) contains an excellent overview of the internals.

### PDFJS 4

There were some changes to how `pdfjs` is packaged, so we are not currently able to package that version with the component.

## Core Logic

Those familiar with `pdfjs` know there are multiple "layers" involved:

* layer with page image
  * use `canvas` or `svg` render mode
  * `svg` rendering has known deficiencies; use at your own risk
* `text` layer containing "searchable" PDF text
* `annotation` layer with the PDF annotations
* `xfa` layer with XFA form layout (not currently supported)

There is also lots of bookkeeping to keep everything consistent:

* Interaction between DOM elements and `pdfjs`
  * Graphic, text, and annotation layers.
  * DPI-awareness.
* Mounting and unmounting while live.
  * DOM elements require bookkeeping while mounted and the zone changes.
* Re-render on size changes.
  * Each rendering is fixed to the container's current size.
  * `canvas` rendering is especially affected by resizing.
* "Bake in" the required CSS (via `style`) to make the layers render correctly.
  * The layers must be "stacked" correctly for visual presentation.

# Page Events

Attach handlers to receive page clicks directly, e.g. track "selected" page(s).  Alter the CSS styling of (specific) pages (`pageContainerClass`), e.g. "highlighting" a clicked page (see demo 3).

# Auto-sizing

Some components require you to set (one of the) dimensions (usually in pixels not CSS units) to render properly, and this is not convenient.

Rather than telling the component what size to use, the component uses the DOM elements to compute the size desired.  This allows you to set the size of the grid cells via CSS.

Sizing has two modes:

* `WIDTH` - conform the document to the width of the container element.  The height is dynamic.
* `HEIGHT` - conform the document to the height of the container element.  The width is dynamic.

In all cases, aspect ratio is preserved.

## Resizing

Because the `canvas` layer is literally a drawing of the page, it requires redrawing once the size of the page container element changes, for layout (conform to new size) resources (down size) and legibility (up size).  This is tracked and handled internally when you activate Resize Management (see below).

# Grid System

Since the `grid` concept is "baked in" there is some configuration required to use it.  In return, you get convenient `slotProps` for binding to the `grid-row` and `grid-column` CSS properties in your grid layout.  This is necessary to properly position slot content in the same cell as the page's DOM elements.

The document container element should use `display:grid` and specify row and column templates, and other `grid` properties as needed.  For a finite grid, specify the overall `height` so grid track heights are defined and not `auto`.  See the demos for examples.

Once the final set of `tiles` is calculated, the grid numbering is applied.  The `tileConfiguration` is used to calculate the row and column coordinates for each tile.

If no `tileConfiguration` is given, no sequencing is applied: the `grid-row` and `grid-column` are both `undefined` (and produce no CSS).

The `TileConfiguration` class provides the following features:

* Ordering row major and column major.
* Fixed count in major and minor dimensions; build "finite" grids of fixed size.
* Variable count in major dimension; allow for "auto" grids.

When the grid has `auto` for the major dimension, you may use any number of pages, because it is set up to number all tiles.

When the grid is finite, that number of tiles (maximum) is always generated.

## Display Options

Using the grid system, you have options for layout:

* Continuous - one continuous row/column of pages.  The number of tiles "visible" depends on the height of the stack currently presenting.  Use `WIDTH` mode (default) and a one-column grid (see below).
* Tileset (n-up) - display a (finite) number of tiles in a grid pattern.  Use `HEIGHT` mode and explicit grid rows and columns (see below).

# Page Management

Because documents may be gigantic, and high-DPI devices require larger rendering, only *some of the pages* should be rendered at any point.

Page management divides pages into "zones":

* Hot - fully materialized to the DOM.
* Warm - "placeholder" pages primarily to make scrolling happen, and provide (correctly sized) space until pages go Hot.
* Cold - outside the range of Hot and Warm pages.

> The default settings make all pages `hot`, so the entire document is rendered upon loading.  This may not be appropriate for your use case.

The zones may center around the `page` indicated by Page Management (zero by default).  The Hot zone directly impacts resource consumption, because the `canvas` etc. are rendered from `pdfjs`.  This is sized to provide a smooth UX while scrolling (i.e. moving the `page` a small amount).

Each time the `pageManagement` prop changes, the zones are recalculated, and pages transition between zones as detected.  In particular, pages becoming `hot` are rendered, and previously `hot` pages get layers (text, annotation) unmounted (if enabled).

## Current and Selected Pages

It is important to note that the component is strictly a tile-rendering engine, and has no sense of "current page" or "selected page(s)".  Tracking this is left totally in your hands.

> See the Page Management and Faux Viewer demos for how to manage a "current/selected page".

## Invoking Page Management

The component has the `pageManagement` prop and implementations of the `PageManagement` class for you to invoke page management as necessary.

The primary goal of Page Management is to ensure the tiles visible to the user are rendered, and other tiles not rendered, in order to balance resources and performance.

> See the Page Management Demo for an illustration of how the zones work.

The easiest way to provide Page Management is via a `computed` property that in turn is tied to reactive state.

If you do not specify `pageManagement` prop the default is used, which labels all pages `hot` to render the entire document upon loading.

## Changing the Start Tile

As mentioned above, the component has no concept of "current page".  However, there must still be a way to tell the component which tile to start rendering on, and Page Management is used for this as well.

> See the Navigation Demo for details; it uses `PageManagement_Scroll` to "page" through a finite grid of 2x3 tiles.

## Using Zones

If you are presenting a finite grid, it makes little sense to render pages not visible, so you should set the `hot` zone to the number of tiles.  This prevents any other pages from being loaded with `pdfjs`.  Be aware that simply accessing the page from `pdfjs` has a cost that should be minimized.

If you are in a "scrolling" scenario (e.g. a 1-column grid) then for the best control you should use Scroll Management (see below).

## Very Large Documents

So why have 3 zones?  Consider a document with 1000 pages viewed on a high-DPI mobile device.  The number of DOM elements for just placeholders
for every page may be too large for the user's device, so it is desirable to keep this to a reasonable number.

What this means is that for the 1000 page document, only N "pages" are represented in the DOM at any point (Hot + Warm), providing enough
elements for scrolling to work.

# Scrolling

With the Continuous layout option, it is important to host the component directly inside the element that provides scrolling, e.g. a `div` with `overflow` management so it has scroll bar(s).  This element is used with an `IntersectionObserver` to determine what tiles are visible (see below).

The most common case is row-major-auto 1-column grid in `WIDTH` size mode (see below); the document container's width is used as the rendering width, and the height is calulated from that using the page's aspect ratio.  The height should be `auto` in this case.  The parent element of the document container will scroll (subject to CSS) vertically.

## Activate Scroll Management

Activate Scroll Management by supplying a value to the `scrollConfiguration` prop, usually during the `loaded` event.  Once set, the component emits `visible-pages` events back to you, via an `IntersectionObserver` it controls.  You must arrange to receive this event, then configure a suitable `PageManagement` instance (in this case `PageManagement_UpdateRange`) and assign it to the `pageManagement` prop.

> See the Faux Viewer demo for how to use Scroll Management.

# Resizing

If your use case includes resizing of pages, e.g. because the window size changes on a desktop platform, you will run into several issues:

* The `canvas` does not automatically redraw itself at the new size.
  * You get a rescaled version of the image from the original size you rendered at.
  * Most noticeable when going from smaller to larger size (blur).
* The text and annotation layers do not rescale themselves to the new size.
  * `pdfjs` uses special CSS properties to calculate their CSS `position`.
  * The value of these special CSS properties depend on the containing element's dimensions (at time of rendering).

Needless to say, if you are anticipating dynamic page resizing, you must activate Resize Management.

## Activate Resize Management

Activate Resize Management by supplying a value of type `ResizeConfiguration` to the `resizeConfiguration` prop.  You must do this on or before the `loaded` event.  Once set, the component uses a `ResizeObserver` to track the DOM.  The options in `resizeConfiguration` determine when to trigger the resize logic.

Once set, the component emits `resize-pages` events back to you, via a `ResizeObserver` it controls.  If you don't need to customize behavior, you may skip receiving this event.  When receiving this event, you get an `Array` of resize page data, with the pages that will be affected.

* `page` is the same information sent from the other events.
* `di` delta inline change in `px`.
* `db` delta block change in `px`.
* `upsize` whether the element is increasing in size (since last render).
* `renderCanvas` flag indicating desire to redraw the `canvas`; based on the `upsize` value (see below).

The important aspect of this is the `redrawCanvas` flag of each entry, which you must set to `true` for the pages that require a `canvas` redraw.

By default (no event handler) the component requests a `canvas` redraw when upsizing only.

Hot and Warm pages have the special CSS properties updated, and Hot pages with the `redrawCanvas` flag set get the `canvas` redrawn.

# Commanding

Certain operations (like printing) typically require the component to "expose" methods for you to call.  Another scenario is scrolling
to a specific page, which requires reference to the DOM element.

In order to provide these, and other user-defined operations, there is a general framework for submitting "commands" to the component.

The `commandPort` prop is a reactive way to submit operations that are scheduled (via `setTimeout`) to execute in an organized fashion with access to parts of the component's internal state, e.g. to access `pdfjs` objects or DOM elements.  The execution "context" handles collecting results and/or error information, and reports back via the `command-complete` event.

An example use case for custom commands is "unwrapping" the PDF document outline (if available) to display a Table of Contents in your favorite tree view UI.  See the Faux Viewer demo for details on how to use the `commandPort` with the OOTB and custom commands.

# Thanks

* `vue-pdf-embed` inspiration and some initial source https://github.com/hrynko/vue-pdf-embed/blob/master/src/vue-pdf-embed.vue
* `vue3-treeview` the TreeView UI in the Faux Viewer demo https://github.com/N00ts/vue3-treeview