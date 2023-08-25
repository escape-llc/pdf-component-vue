# Vue 3 PDF Component

Taking a stab at creating an up-to-date PDFJS-based Vue JS component.

This component is primarily for rendering tiles (i.e. PDF pages) in a `grid` or `flex` layout.

It is not a (full-blown) viewer, but could be used to make one.

## PDFJS

This assumes you already know a little about how PDFJS works; there is lots of glossing over.

You don't require any knowledge of it to use this control.

Uses a current build of PDFJS.

## Goals

* Be CSS-agnostic, but biased towards grid/flex treatment.
* Have lots of `$emit` for flexibility on the consumer.
* Have  "smart" page management OOTB.
* Support real-time scrolling via `IntersectionObserver`.
* Leverage the component nature and slots.
* Have "smart" page sizing based on containing element.

# Display Modes

* Continuous - indended for one continuous row/column of pages.  The number of tiles "visible" depends on the height of the stack currently presenting.
* Tileset (n-up) - intended for displaying a fixed number of tiles, e.g. in a grid pattern.

# Scrolling

In the Continuous mode, it is important to host the component directly inside the element that provides scrolling,
e.g. a `div` with `overflow` management so it has scroll bar(s).  This element is used with an `IntersectionObserver`
to determine what tiles are visible.

The most common case is vertically stacked tiles with size-to-width; the container's width is used as the rendering width, and the height is calulated from that using the page's aspect ratio.  The height should be `auto` in this case.

# Auto-sizing

Rather than telling the component what size to use, the component uses the DOM elements to compute the size desired.

# Page Management

Because documents can be gigantic, only *some of the pages* are rendered at any point.

Page management is divided into these "zones":

* Hot - materialized to the `canvas` and text/anno layers.
* Warm - "placeholder" pages primarily to make scrolling happen, and provide space until pages go Hot.
* Cold - pages outside the range of Hot and Warm pages.

The zones center around the Current Page or just `page`.  The Hot zone directly impacts
resource consumption, because the `canvas` etc. are rendered from PDFJS.  This is sized
to provide a smooth UX while scrolling (i.e. moving the `page` a small amount).

Each time the `page` moves, the zones are recalculated, and pages transition between zones as detected.

## Very Large Documents

So why have 3 zones?  Consider a document with 1000 pages.  The number of DOM elements for just placeholders
for every page may be too large for the user's device, so it is desirable to keep this to a reasonable number,
say 100.

What this means is that for the 1000 page document, only 100 "pages" are represented in the DOM at any point (Hot + Warm), providing enough
elements for scrolling to work.