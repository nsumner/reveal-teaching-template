

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


export { rewriteDuplicateIDs };
