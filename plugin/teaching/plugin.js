import { animateSVGs } from "./animate-svg.js";

window.RevealTeaching = window.RevealTeaching || (() => {
  let deck;
  return {
    id: 'teaching',
    init: function(reveal) {
      deck = reveal;
      return initTeaching(deck);
    }
  };
});


const inferTitleFromMarkdown = function() {
  // Try setting the HTML title based on the title extracted from the
  // Markdown slides.
  const mainTitle = document.querySelectorAll("h1");
  if (1 === mainTitle.length ) {
    document.title = mainTitle[0].innerText;
  }
};


const addPrintTag = function(slide) {
  const printTag = document.createElement("span");
  printTag.innerHTML = "[<a href=\"?print-pdf\">printable</a>]";
  printTag.style.position = "absolute";
  printTag.style.left = 0;
  printTag.style.bottom = "1em";
  printTag.id = "print-tag";
  printTag.classList.add("no-print");
  slide.appendChild(printTag);
};


const convertOvernotesToFragments = function() {
  for (const note of document.querySelectorAll(":is(.overnote, .overnote-bottom, .overnote-inline)")) {
    note.classList.add("fragment");
  }
};


const canonicalizeReferenceLists = function() {
  // Propagate embedded reference list markers to the containing list.
  for (const list of document.querySelectorAll(":is(ul, ol):has(> li.reference-list, > li > a.reference-list)")) {
    list.classList.add("reference-list", "blocklist");
  }
  // Remove propagated reference list markers so that they do not style twice.
  for (const list of document.querySelectorAll(":is(li.reference-list, li > a.reference-list)")) {
    list.classList.remove("reference-list");
  }
};


const convertListsItemsToFragments = function() {
  // Some desired behavioral properties shouls be inferred from the raw
  // Markdown slides to make creating and managing content more convenient.
  for (const listItem of document.querySelectorAll(":not(.blocklist, :has(> .blocklist)) > li")) {
    if (!listItem.classList.contains("noinc")) {
      listItem.classList.add("fragment");
      if (!listItem.classList.value.includes("fade")) {
        listItem.classList.add("fade-in-then-semi-out");
      }
    }
  }
};


const inlineSVGs = async function() {
  const svgImages = document.querySelectorAll('img[src]:not([src=""])');
  for (const svgImage of svgImages) {
    try {
      const response = await fetch(svgImage.src);
      // Require a clear "OK" status to complete inlining.
      if (response.status != 200) {
        throw new Error(`Bad status code in response: {response.status}`);
      }
      const svgText = await response.text();
      const container = document.createElement('div');
      container.innerHTML = svgText;
      svgImage.replaceWith(container.querySelector("svg"));
    } catch (error) {
      console.error('Could not inline svg:', svgImage.src, error);
    }
  }
};


const initTeaching = async function(deck) {
  Reveal.configure({
    // PDF printing can prioritize note taking when all fragments on
    // a slide are displayed in a single slide.
    // TODO: Identify slides with transient or disappearing elements
    // to automatically separate them into different pages.
    pdfMaxPagesPerSlide: 1,
    pdfSeparateFragments: false
  });

  inferTitleFromMarkdown();
  convertOvernotesToFragments();
  canonicalizeReferenceLists();

  await inlineSVGs();
  animateSVGs(deck);

  // NOTE: Must run after other functions that may produce block lists
  convertListsItemsToFragments();

  deck.on('ready', () => {
    for (const deferred of document.querySelectorAll(".deferred-fragment")) {
      console.log(deferred);
      deferred.classList.add("fragment");
    }
  });

  // Add a printing link to the first page
  const firstPage = deck.getSlidesElement().querySelector("section:first-child");
  addPrintTag(firstPage);
};
