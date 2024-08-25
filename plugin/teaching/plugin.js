
window.RevealTeaching = window.RevealTeaching || (() => {
  let deck;
  return {
    id: 'teaching',
    init: function(reveal) {
      deck = reveal;
      initTeaching(deck);
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


/**************************************************
 * TODO: Spin animation into its own module.
 * *************************************************/

class SVGHandlers {
  constructor(reset, show, hide, fade) {
    this.reset = reset;
    this.show = show;
    this.hide = hide;
    this.fade = fade;
  }
}


const hideAnimationElement = function(element) {
  element.classList.remove("animate-svg-shown", "animate-svg-faded");
  element.classList.add("animate-svg-hidden");
};
const showAnimationElement = function(element) {
  element.classList.remove("animate-svg-hidden", "animate-svg-faded");
  element.classList.add("animate-svg-shown");
};
const fadeAnimationElement = function(element) {
  element.classList.remove("animate-svg-shown", "animate-svg-hidden");
  element.classList.add("animate-svg-faded");
};


const hideIDsBelow = function(element) {
  for (const drawable of element.querySelectorAll('[id]:not([id]="")')) {
    hideAnimationElement(drawable);
  }
};


//TODO: flesh this out for general svg.
const rawSVGHandlers = new SVGHandlers(
  null, null, null, null
);


const hideMermaidElements = function(animation) {
  const figure = animation.svgFigure;
  const elements = figure.querySelectorAll(".edgePaths path, .edgeLabels .edgeLabel, .nodes .node");
  for (element of elements) {
    hideAnimationElement(element);
  }
};


// All of the mermaid handling is based on incremental reveals from nothing.
// Is that the only use case?
// Do we even want edge controls?

const lazyInitializeMermaid = function(animation) {
  const figure = animation.svgFigure;
  if (!figure.classList.contains("animate-svg-hidden")) {
    return;
  }

  figure.classList.remove("animate-svg-hidden");
  animation.nodes = new Map();
  for (const node of figure.querySelectorAll(".nodes .node")) {
    animation.nodes.set(node.getAttribute("data-id"), node);
  }
  const edges = Array.from(figure.querySelectorAll(".edgePaths path"));
  const edgeLabels = Array.from(figure.querySelectorAll(".edgeLabels .edgeLabel"));
  animation.edgeLabelPairs = Array.from(edges.map((e, i) => [e, edgeLabels[i]]));
};


const updateMermaidEdgesFromNodes = function(animation) {
  for (const [edge, label] of animation.edgeLabelPairs) {
    const ready = Array.from(edge.id.substring(2, edge.id.length - 2).split("-"))
                         .every((id) => !animation.nodes.get(id).classList.contains("animate-svg-hidden"));
    if (ready) {
      showAnimationElement(edge);
      showAnimationElement(label);
    } else {
      hideAnimationElement(edge);
      hideAnimationElement(label);
    }
  }
};


const buildMermaidNodeUpdate = function(nodeOperation) {
  return function(animation, step) {
    lazyInitializeMermaid(animation);
    const figure = animation.svgFigure;

    for (const [name, node] of animation.nodes) {
      if (!step.svgFragmentIDs.includes(name)) {
        continue;
      }
      nodeOperation(node);
    }

    updateMermaidEdgesFromNodes(animation);
  }
};


const mermaidNodeHandlers = new SVGHandlers(
  hideMermaidElements,
  buildMermaidNodeUpdate(showAnimationElement),
  buildMermaidNodeUpdate(hideAnimationElement),
  buildMermaidNodeUpdate(fadeAnimationElement)
);


// TODO: refactor into a more extensible animation handler.
const prepareSVGAnimation = function(animation, classes) {
  if (classes.contains("mermaid")) {
    if (!animation.svgFigure.classList.contains("mermaid")) {
      console.error("Linked figure was not a mermaid figure.");
    }

    if (classes.contains("nodes")) {
      animation.svgFigure.classList.add("animate-svg-hidden");
      return mermaidNodeHandlers;
    } else {

    }
  }
  return rawSVGHandlers;
};


const buildAnimationFragments = function(text) {
  const fragments = text.split('\n').map((line) => {
    const afterIndexPos = line.indexOf('.');
    const afterIndex = line.substring(afterIndexPos + 1);
    const openPos = afterIndex.indexOf('(');
    const closePos = afterIndex.lastIndexOf(')');

    const fragment = document.createElement("span");
    fragment.svgFragmentIndex = parseInt(line.substring(0, afterIndexPos));
    fragment.svgFragmentOperation = afterIndex.substring(0, openPos).trim();
    fragment.svgFragmentIDs = afterIndex.substring(openPos + 1, closePos)
                                        .split(",")
                                        .map(item => item.trim());
    fragment.setAttribute("data-fragment-index", fragment.svgFragmentIndex.toString());
    fragment.classList.add("fragment", "animate-svg");
    return fragment;
  });
  return fragments;
};


const updateAnimatedSVG = function(animation) {
  if (!animation.svgFigure.querySelector("svg")) {
    console.log("Figure not yet drawn at animation update");
    return;
  }

  const handlers = animation.svgHandlers;
  handlers.reset(animation);
  for (const step of Array.from(animation.children)) {
    if (!step.classList.contains("visible")) {
      break;
    }
    switch (step.svgFragmentOperation) {
      case "show":
        handlers.show(animation, step);
        break;
      case "hide":
        handlers.hide(animation, step);
        break;
      case "fade":
        handlers.fade(animation, step);
        break;
      default:
        console.error("Unknown svg-animate operation:", step.svgFragmentOperation);
    }
  }
};


const animateSVGs = function(deck) {
  const animations = document.querySelectorAll("pre > code.animate-svg");
  for (const animation of animations) {
    const animationTag = document.createElement("span");
    animationTag.classList.add("animate-svg");

    const steps = buildAnimationFragments(animation.innerText);
    animationTag.append(...steps);
    animationTag.svgMinIndex = Math.min(...steps.map((step)=>step.svgFragmentIndex));
    animationTag.svgFigure = animation.parentElement.previousElementSibling;
    animationTag.svgHandlers = prepareSVGAnimation(animationTag, animation.classList);

    animation.parentElement.replaceWith(animationTag);
  }

  const handleFragmentChange = (event) => {
    const animated = event.fragments.filter((fragment)=>fragment.classList.contains("animate-svg"));
    if (0 == animated.length) {
      return;
    }

    const body = document.querySelector('body');
    const currentIndex = deck.getIndices();
    // There can be either show or hide events for a single update, and
    // we only want to update once, so track the time of the last event
    // to detect and filter duplicates.
    if (body.lastSVGUpdate === currentIndex) {
      return;
    }
    body.lastSVGUpdate = currentIndex;

    const figures = new Set(animated.map((fragment) => fragment.parentElement));
    for (const figure of figures) {
      updateAnimatedSVG(figure);
    }
  };
  deck.on('fragmentshown', handleFragmentChange);
  deck.on('fragmenthidden', handleFragmentChange);
};
/**************************************************/


const initTeaching = function(deck) {
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
