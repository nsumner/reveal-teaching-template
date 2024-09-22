import { animateSVGs } from "./animate-svg.js";
import { rewriteDuplicateIDs } from "./deduplicate.js"

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


// This function allows classes for a parent element in the dom to be specified
// via an attribute of a child. This is useful because Markdown only gives
// access to children in some cases where applying a class to a parent is
// desired. For instance, lists give access to elements but not the list.
const pushParentClasses = function() {
  const haveParentClasses = Array.from(document.querySelectorAll("[data-parent-classes]"))
                                 .filter(element => element.parentElement);
  for (const element of haveParentClasses) {
    const parent = element.parentElement;
    const classes = element.getAttribute('data-parent-classes').split(' ');
    parent.classList.add(...classes);
    element.removeAttribute('data-parent-classes');
  }
}


const pushParentStyles = function() {
  const haveParentStyles = Array.from(document.querySelectorAll("[data-parent-styles]"))
                                 .filter(element => element.parentElement);
  for (const element of haveParentStyles) {
    const parent = element.parentElement;
    const style = element.getAttribute('data-parent-styles');
    parent.style = style;
    element.removeAttribute('data-parent-styles');
  }
}


const addFontsTag = function(slide) {
  const fontTag = document.createElement("span");
  fontTag.innerHTML = "[<a href=\"https://github.com/tonsky/FiraCode\">Fira Code</a>, "
                    + "<a href=\"https://fonts.google.com/specimen/Carlito\">Carlito</a>]";
  fontTag.style.position = "absolute";
  fontTag.style.left = 0;
  fontTag.style.bottom = "0em";
  fontTag.id = "fonts-tag";
  fontTag.classList.add("no-print");
  slide.appendChild(fontTag);
};


const addPrintTag = function(slide) {
  const printTag = document.createElement("span");
  printTag.innerHTML = "[<a href=\"?print-pdf\">printable/PDF</a>]";
  printTag.style.position = "absolute";
  printTag.style.left = 0;
  printTag.style.bottom = "1em";
  printTag.id = "print-tag";
  printTag.classList.add("no-print");
  slide.appendChild(printTag);
};


const unescapeHTML = function(str) {
  return new DOMParser()
    .parseFromString(str, "text/html")
    .documentElement
    .textContent;
}


const extractMarkdownOvernotes = function() {
  const overnotes = document.querySelectorAll("pre > code:is(.overnote,.overnote-display,.overnote-inline,.overnote-bottom)");
  for (const note of overnotes) {
    const noteTag = document.createElement("div");
    noteTag.className = note.className;

    noteTag.innerHTML = note.innerHTML.split('\n')
                                      .map(line => unescapeHTML(line))
                                      .join('<br>');

    const fragmentIndex = note.getAttribute('data-line-numbers');
    if (fragmentIndex) {
      noteTag.setAttribute('data-fragment-index', fragmentIndex);
      noteTag.removeAttribute('data-line-numbers');
    }

    note.parentElement.replaceWith(noteTag);
  }
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
  for (const listItem of document.querySelectorAll(":not(.blocklist, :has(> .blocklist), .reference-list) > li")) {
    if (!listItem.classList.contains("noinc")) {
      listItem.classList.add("fragment");
      if (!listItem.classList.value.includes("fade")) {
        listItem.classList.add("fade-in-then-semi-out");
      }
    }
  }
};


const copyAttributes = function(source, target) {
  for (const attr of source.attributes) {
    const attrName = attr.name === "id" ? 'data-id' : attr.name;
    target.setAttribute(attrName, attr.value);
  }
};


const inlineSVGs = async function() {
  const svgImages = Array.from(document.querySelectorAll('img[src]:not([src=""])'))
                         .filter(image => image.src.endsWith(".svg"));
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
      const newSVG = container.querySelector("svg");
      copyAttributes(svgImage, newSVG);
      svgImage.replaceWith(newSVG);
      rewriteDuplicateIDs(newSVG);
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
  pushParentClasses();
  pushParentStyles();
  extractMarkdownOvernotes();
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
  addFontsTag(firstPage);
};
