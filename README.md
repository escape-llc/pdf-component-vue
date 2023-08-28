# Vue 3 PDF Component

Taking a stab at creating an up-to-date PDFJS-based Vue JS component.

This component is primarily for rendering tiles (i.e. PDF pages) in a `grid` or `flex` layout.

It is not a (full-blown) viewer, but could be used to make one.

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
  * This includes the `page` itself!
* Have  "smart" page management OOTB.
* Support real-time scrolling via `IntersectionObserver`.
* Have "smart" page sizing based on containing element.

# Slots

Slots provide you places to inject content, including the `page` itself!

Since the page is a slot, we are obliged to provide the `PdfPage` component for your benefit.  This encapsulates all the interaction
with `pdfjs` to render the graphic, text, and annotation layers of the document.  It also "bakes in" the required CSS (via `style`) to make
the layers render correctly.

Why is the `page` a slot?  This is something no one else is doing in their components, but there is an important
benefit:  You can directly attach your component to the props and emits of the `page` without relying on whatever
passthrough the top-level component offers.

What can you do with this?

* Attach handlers to receive page clicks directly, e.g. track "selected" page(s).
* Alter the CSS styling of pages (`containerClass`), e.g. "highlighting" a clicked page (see demo 3).
* Not render the pages at all with `PdfPage` and substitute your own content instead.

# Scrolling

In the Continuous mode, it is important to host the component directly inside the element that provides scrolling,
e.g. a `div` with `overflow` management so it has scroll bar(s).  This element is used with an `IntersectionObserver`
to determine what tiles are visible.

The most common case is vertically stacked tiles with size-to-width; the container's width is used as the rendering width, and the height is calulated from that using the page's aspect ratio.  The height should be `auto` in this case.

# Auto-sizing

Some components require you to set (one of the) dimensions to render properly, and this is not convenient.

Rather than telling the component what size to use, the component uses the DOM elements to compute the size desired.  This allows you
to set the size of the grid cells via CSS.

Sizing has two modes:

* `WIDTH` - conform the document to the width of the container element.  The height is dynamic.
* `HEIGHT` - conform the document to the height of the container element.  The width is dynamic.

In all cases, aspect ratio is preserved.

# Grid System

Since the `grid` concept is really "baked in" there is some configuration required to use it.  In return, you get convenient
`slotProps` for binding to the `grid-row` and `grid-column` CSS properties in your grid layout.

The document container element should use `display:grid` and specify row and column templates, and other `grid` properties as needed.  For
a fixed grid, specify the `height` so grid track heights are defined and not `auto`.  See the demos for examples.

Once the final set of `tiles` is calculated, the grid numbering is applied.  The `tileDimensions` elements are used for the row (0) and column (1) counts.

By default (`tileCount` is `undefined`) you may overflow any fixed row count, e.g. your grid is smaller than the `pageCount`.  Use the `tileCount` to control how many tiles to use.  When `tileCount` is `undefined` the `pageCount` is used instead.

> Currently only row-major numbering is supported.

## Display Modes

Using the grid system, you have options for layout:

* Continuous - one continuous row/column of pages.  The number of tiles "visible" depends on the height of the stack currently presenting.  Use `WIDTH` mode (default) and a one-column grid (see below).
* Tileset (n-up) - display a number of tiles in a grid pattern.  Use `HEIGHT` mode and explicit grid rows and columns (see below).

# Page Management

Because documents may be gigantic, only *some of the pages* are rendered at any point.

Page management is divided into these "zones":

* Hot - materialized to the `canvas` and text/anno layers.
* Warm - "placeholder" pages primarily to make scrolling happen, and provide space until pages go Hot.
* Cold - pages outside the range of Hot and Warm pages.

> The default settings make all pages `hot`, so the entire document is rendered upon loading.  This may not be appropriate in all cases.

The zones center around the Current Page or just `page`.  The Hot zone directly impacts
resource consumption, because the `canvas` etc. are rendered from `pdfjs`.  This is sized
to provide a smooth UX while scrolling (i.e. moving the `page` a small amount).

Each time the `page` moves, the zones are recalculated, and pages transition between zones as detected.  In particular, pages becoming
`hot` are rendered.

## Very Large Documents

So why have 3 zones?  Consider a document with 1000 pages.  The number of DOM elements for just placeholders
for every page may be too large for the user's device, so it is desirable to keep this to a reasonable number,
say 100.

What this means is that for the 1000 page document, only 100 "pages" are represented in the DOM at any point (Hot + Warm), providing enough
elements for scrolling to work.