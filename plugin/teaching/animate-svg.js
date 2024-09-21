
class SVGHandlers {
  constructor(reset, show, hide, fade, high) {
    this.reset = reset;
    this.show = show;
    this.hide = hide;
    this.fade = fade;
    this.high = high;
  }
}


const hideAnimationElement = function(element) {
  element.classList.remove("animate-svg-shown", "animate-svg-faded", "animate-svg-high");
  element.classList.add("animate-svg-hidden");
};
const showAnimationElement = function(element) {
  element.classList.remove("animate-svg-hidden", "animate-svg-faded", "animate-svg-high");
  element.classList.add("animate-svg-shown");
};
const fadeAnimationElement = function(element) {
  element.classList.remove("animate-svg-shown", "animate-svg-hidden", "animate-svg-high");
  element.classList.add("animate-svg-faded");
};
const highAnimationElement = function(element) {
  element.classList.remove("animate-svg-shown", "animate-svg-hidden", "animate-svg-faded");
  element.classList.add("animate-svg-high");
};


/****************************************************************************
 * Plain SVG animation
 ****************************************************************************/

const hideIDsInSVG = function(animation) {
  for (const component of animation.components) {
    hideAnimationElement(component);
  }
}


const initializeSVG = function(animation) {
  const figure = animation.svgFigure;
  animation.components = Array.from(figure.querySelectorAll("[id]:not(marker)"));
  hideIDsInSVG(animation);
}


const buildSVGUpdate = function(nodeOperation) {
  return function(animation, step) {
    const figure = animation.svgFigure;

    const components = animation.components.filter((c)=>step.svgFragmentIDs.includes(c.id));
    for (const component of components) {
      nodeOperation(component);
    }
  }
};


//TODO: flesh this out for general svg.
// For now, only support incremental reveal similar to mermaid.
const rawSVGHandlers = new SVGHandlers(
  function(animation) { hideIDsInSVG(animation); },
  buildSVGUpdate(showAnimationElement),
  buildSVGUpdate(hideAnimationElement),
  buildSVGUpdate(fadeAnimationElement),
  buildSVGUpdate(highAnimationElement),
);


/****************************************************************************
 * Mermaid figures
 ****************************************************************************/

const hideMermaidElements = function(animation) {
  const figure = animation.svgFigure;
  const elements = figure.querySelectorAll(".edgePaths path, .edgeLabels .edgeLabel, .nodes .node");
  for (const element of elements) {
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


// This function may need customization for figure types unless there is a good
// pattern. Treat as suspect. The inferred specification for edge ids so far is:
//   <alpha prefix> SEP <node 1 ID> SEP <node 2 ID> SEP <numeric suffix>
// where SEP is a single character of punctuation presently in: - _
const updateMermaidEdgesFromNodes = function(animation) {
  for (const [edge, label] of animation.edgeLabelPairs) {
    const ready = Array.from(edge.id.split(/[-_]/))
                       .slice(1, 3)
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
  buildMermaidNodeUpdate(fadeAnimationElement),
  buildMermaidNodeUpdate(highAnimationElement)
);


/****************************************************************************
 * Binding specific figure types to the framework
 ****************************************************************************/

// TODO: refactor into a more extensible animation handler.
const prepareSVGAnimation = function(animation, classes) {
  if (classes.contains("mermaidsvg")) {
    if (!animation.svgFigure.classList.contains("mermaid")) {
      console.error("Linked figure was not a mermaid figure.");
    }

    if (classes.contains("nodes")) {
      animation.svgFigure.classList.add("animate-svg-hidden");
      return mermaidNodeHandlers;
    } else {

    }
  }
  initializeSVG(animation);
  return rawSVGHandlers;
};


/****************************************************************************
 * Only general animation framework below
 ****************************************************************************/

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
  if (!(animation.svgFigure.nodeName == "svg"
        || animation.svgFigure.querySelector("svg"))) {
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

export { animateSVGs };
