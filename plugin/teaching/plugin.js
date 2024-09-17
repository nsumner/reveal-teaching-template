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
  for (const listItem of document.querySelectorAll(":not(.blocklist, :has(> .blocklist)) > li")) {
    if (!listItem.classList.contains("noinc")) {
      listItem.classList.add("fragment");
      if (!listItem.classList.value.includes("fade")) {
        listItem.classList.add("fade-in-then-semi-out");
      }
    }
  }
};


const recursivelyChangeNames = function(idMap, node) {
  const remapInString = function(original, remapped, str) {
    return str.replace(new RegExp(`\\b${original}\\b`, 'g'), `${remapped}`);
  };
  const remapAllIDs = function(getter, setter, debug=false) {
    for (const [key, value] of idMap.entries()) {
      const haystack = getter();
      if (haystack.includes(key)) {
        const remapped = remapInString(key, value, haystack);
        setter(remapped);
      }
    }
  };

  if (node.nodeType === Node.ELEMENT_NODE) {
    for (const attr of node.attributes) {
      if (idMap.has(attr.value)) {
        node.setAttribute(attr.name, idMap.get(attr.value));
      } else {
        remapAllIDs(()=>attr.value, (newStr)=>node.setAttribute(attr.name, newStr));
      }
    }
  }

  if (['CODE', 'STYLE'].includes(node.nodeName.toUpperCase()) && node.textContent) {
    remapAllIDs(()=>node.textContent, (newStr)=>{node.textContent = newStr;});
  }

  for (const child of node.children) {
    recursivelyChangeNames(idMap, child);
  }
}


const extractDuplicatedIDs = function(subtree) {
  const localIDElements = Array.from(subtree.querySelectorAll("[id]"));
  const otherIDElements = new Set(document.querySelectorAll("[id]"))
                          .difference(new Set(localIDElements));

  const otherIDs = new Set(Array.from(otherIDElements).map(element => element.id));
  const localIDs = new Set(localIDElements.map(element => element.id));
  return otherIDs.intersection(localIDs);
};


const extractDuplicatedClasses = function(subtree) {
  const classPattern = /\.([a-zA-Z0-9_-]+)/g;
  const extractDefinedClasses = function(style) {
    const names = style.textContent
                       .split('\n')
                       .map(line => line.slice(0, line.indexOf('{')))
                       .filter(line => line != '')
                       .map(line => line.match(classPattern))
                       .flatMap(match => match ? match[0].slice(1) : []);
    return names;
  };
  const localStyleElements = Array.from(subtree.querySelectorAll("style"));
  const otherStyleElements = new Set(document.querySelectorAll("style"))
                             .difference(new Set(localStyleElements));

  const otherClasses = new Set(Array.from(otherStyleElements)
                                    .map(element => extractDefinedClasses(element))
                                    .flat());
  const localClasses = new Set(localStyleElements.map(element => extractDefinedClasses(element))
                                                .flat());
  return otherClasses.intersection(localClasses);
}


const rewriteDuplicateIDs = function(idContainer) {
  const duplicateIDs = extractDuplicatedIDs(idContainer);
  const duplicateClasses = extractDuplicatedClasses(idContainer);

  if (duplicateIDs.length === 0 && dupliateClasses.length === 0) {
    return;
  }

  // Sections identify the current slide. We use the slides to disambiguate as
  // a matter of best effort disambiguation.
  const slides = Array.from(document.querySelectorAll("section"));
  const slide = idContainer.closest("section");
  const index = slides.indexOf(slide) + 1;

  const idMap = new Map();
  for (const id of duplicateIDs) {
    idMap.set(id, `${id}_slide${index}`);
  }
  for (const name of duplicateClasses) {
    idMap.set(name, `${name}_slide${index}`);
  }
  recursivelyChangeNames(idMap, slide);
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
