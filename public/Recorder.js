//  (function() {
//      // Check if the script has already been executed
//      if (document.hasRun) {
//        return;
//      }
//      document.hasRun = true;



var callsClick = 0;
var sanitizedClick = [];
var callsFocusOut = 0;
var sanitizedFocusOut = [];


// wait 50ms before sending the result to ensure that any click events which are generated
// on multiple elements for the same click only send one result
function shouldSendClick(e, callback) {
  if((e.type === 'click' || e.type === 'click-update' || e.type === 'click-link') && (e.ctrlKey || e.shiftKey)) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
  callsClick++;
  sanitizedClick.push(e);
  // if there weren't any previous click events then set the current event as the previous
  setTimeout(function () {
    if(callsClick > 1) {
      sanitizedClick.shift();
      callsClick--;
    }
    else {
      callback(sanitizedClick[0]);
      sanitizedClick = [];
      callsClick = 0;
    }
  }, 50);
}

// wait 50ms before sending the result to ensure that any click events which are generated
// on multiple elements for the same click only send one result
function shouldSendFocusOut(e, callback) {
    callsFocusOut++;
    sanitizedFocusOut.push(e);
    // if there weren't any previous click events then set the current event as the previous
    setTimeout(function () {
      if(callsFocusOut > 1) {
        sanitizedFocusOut.shift();
        callsFocusOut--;
      }
      else {
        callback(sanitizedFocusOut[0]);
        sanitizedFocusOut = [];
        callsFocusOut = 0;
      }
    }, 50);
  }

if (typeof HTMLElement !== "undefined" && HTMLElement) {
  HTMLElement.prototype.catchSingleEvent = function(type, callback) {
    this.addEventListener(type, function(e) {
        if(e.type === 'click') {
            shouldSendClick(e, function(evt) {callback(evt);});
        }
        else if(e.type === 'focusout') {
            shouldSendFocusOut(e, function(evt) {callback(evt);});
        }
    });
  }
}

if (typeof SVGSVGElement !== "undefined" && SVGSVGElement) {
  SVGSVGElement.prototype.catchSingleEvent = function(type, callback) {
    this.addEventListener(type, function(e) {
        if(e.type === 'click') {
            shouldSendClick(e, function(evt) {callback(evt);});
        }
        else if(e.type === 'focusout') {
            shouldSendFocusOut(e, function(evt) {callback(evt);});
        }
    });
  }
}

  
function highlightElement_Record(element) {
  const overlay = document.createElement('div');
  overlay.classList.add('highlight-overlay'); // Apply the CSS class for the overlay
  document.body.appendChild(overlay);
  const rect = element.getBoundingClientRect();
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  overlay.style.top = `${rect.top + window.scrollY}px`;
  overlay.style.left = `${rect.left + window.scrollX}px`;
  overlay.style.display = 'block';
}

function removeHighlight(overlay) {
  if (overlay) {
    overlay.remove();
  }
}

function findClosest(query)
{
  return this.closest(query);
}

// Function to check if an element is a link
function isLink(element) {
    if (!element || !element.tagName) {
        return false;
    }

    // Check if the element is an <a> element with an href attribute
    if (element.tagName.toLowerCase() === 'a' && element.hasAttribute('href')) {
        return true;
    }

    // Check for ARIA roles that indicate a link
    const linkRoles = ['link'];
    const role = element.getAttribute('role');
    if (role && linkRoles.includes(role)) {
        return true;
    }

    return false;
}

// Function to check if an element is a clickable button or similar
function isClickableButton(element) {
    if (!element || !element.tagName) {
        return false;
    }

    // Check if the element is a <button> element or an <input> element with type='button', 'submit', or 'reset'
    const clickableInputTypes = ['button', 'reset'];

    const tagName = element.tagName.toLowerCase();

    if (tagName === 'button') {
        return true;
    }
    if (tagName === 'input' && clickableInputTypes.includes(element.type.toLowerCase())) {
        return true;
    }

    // Check for ARIA roles that indicate a button
    const buttonRoles = ['button', 'tab'];
    const role = element.getAttribute('role');
    if (role && buttonRoles.includes(role)) {
        return true;
    }

    // Check if the element is a div or span with a role of button and is clickable
    if ((tagName === 'div' || tagName === 'span') && role === 'button') {
        return true;
    }

    return false;
}

// Function to check if an element is a form
function isForm(element) {
    if (!element || !element.tagName) {
        return false;
    }

    const tagName = element.tagName.toLowerCase();

    // Check if the element is a <form> element
    if (tagName === 'form') {
        return true;
    }

    // Check if the element is a <button> or <input> element with type 'submit'
    if ((tagName === 'button' || tagName === 'input') && element.type.toLowerCase() === 'submit' && element.form) {
        return true;
    }

    // Check for ARIA roles that indicate a form
    const formRoles = ['form'];
    const role = element.getAttribute('role');
    if (role && formRoles.includes(role)) {
        return true;
    }

    return false;
}

function isTextInputField(element) {
    if (!element || !element.tagName) {
        return false;
    }
    if (element.tagName.toLowerCase() === 'input') {
        const textInputTypes = ['text', 'password', 'email', 'number', 'search', 'tel', 'url', 'p_email', 'range', 'color', 'date', 'time', 'datetime-loal', 'month', 'week'];
        if (textInputTypes.includes(element.type.toLowerCase())) {
            return true;
        }
    } else if (element.tagName.toLowerCase() === 'textarea') {
        return true;
    }

    // Check if the element is contenteditable
    if (element.isContentEditable) {
        return true;
    }

    // Check for ARIA roles that indicate text input functionality
    const textInputRoles = ['textbox', 'searchbox'];
    const role = element.getAttribute('role');
    if (role && textInputRoles.includes(role)) {
        return true;
    }

    return false;
}

function isDropdown(element) {
    if (!element || !element.tagName) {
        return false;
    }
    // Check if the element is a <select> element
    if (element.tagName.toLowerCase() === 'select') {
        return true;
    }

    // Check if the element has ARIA roles that indicate a dropdown
    const dropdownRoles = ['combobox', 'listbox', 'menu', 'menuitem', 'option'];
    const role = element.getAttribute('role');
    if (role && dropdownRoles.includes(role)) {
        return true;
    }

    // Check for other attributes or class names commonly used for dropdowns
    // This part is optional and can be customized based on your specific use case
    const dropdownClassNames = ['dropdown', 'select'];
    const classNames = element.className?.split?. (/\s+/);
    if (classNames?.some(className => dropdownClassNames.includes(className))) {
        return true;
    }

    // Check for data attributes (optional)
    if (element.hasAttribute('data-toggle') && element.getAttribute('data-toggle') === 'dropdown') {
        return true;
    }

    //Only of the control has data-testid="c-drop-down-item" attribute, Please consider this too as a dropdown
    if (element.hasAttribute('data-testid') && element.getAttribute('data-testid') === 'c-drop-down-item') {
        return true;
    }

    return false;
}

function isCheckboxOrRadio(element) {
    if (!element || !element.tagName) {
        return false;
    }

    // Check if the element is an <input> element
    if (element.tagName.toLowerCase() === 'input') {
        const type = element.getAttribute('type') || element.type;
        if (type === 'checkbox' || type === 'radio') {
            return true;
        }
    }

    return false;
}

//Optimal-Select library
/////////////
function getSingleSelector(element, options = {}) {
    if (element.nodeType === 3) { // If it's a text node, get its parent.
        element = element.parentNode;
    }

    if (element.nodeType !== 1) {
        throw new Error('Invalid input - only HTMLElements or representations of them are supported!');
    }

    function escapeValue(value) {
        return value && value.replace(/['"`\\/:?&!#$%^()[\]{|}*+;,.<=>@~]/g, '\\$&').replace(/\n/g, '\\A');
    }

    function match(node) {
        let path = [], element = node;

        while (element && element !== document.documentElement) {
            let selector = element.tagName?.toLowerCase();
            if (element.id) {
                selector += '#' + escapeValue(element.id);
                path.unshift(selector);
                break; // An ID is unique enough for a selector, no need to go further.
            } else {
                let siblingIndex = 1;
                for (let sibling = element.previousElementSibling; sibling; sibling = sibling.previousElementSibling) {
                    if (sibling.tagName?.toLowerCase() === element.tagName?.toLowerCase()) siblingIndex++;
                }
                selector += ':nth-of-type(' + siblingIndex + ')';
                path.unshift(selector);
                element = element.parentNode;
            }
        }

        return path.join(' > ');
    }

    function optimize(selector, element) {
        // Simplify selector if it starts from the body
        let optimizedSelector = selector.startsWith('html > body > ') ? selector.substring(14) : selector;
        return optimizedSelector;
    }

    try {
        let selector = match(element);
        return optimize(selector, element);
    } catch(e) {
        console.log(e);
    }

    return null;
}

function getAriaSelector1(element) {
    if (!element) return '';

    function getAriaAttributes(el) {
        const ariaAttributes = ['aria-label', 'aria-labelledby', 'role'];
        let attributes = {};

        ariaAttributes.forEach(attr => {
            if (el.hasAttribute(attr)) {
                attributes[attr] = el.getAttribute(attr);
            }
        });

        return attributes;
    }

    function buildAriaSelector(el) {
        let selectorParts = [];
        let currentElement = el;

        while (currentElement && currentElement !== document.body) {
            let ariaAttrs = getAriaAttributes(currentElement);

            if (Object.keys(ariaAttrs).length > 0) {
                let part = Object.entries(ariaAttrs)
                    .map(([key, value]) => `[${key}="${value}"]`)
                    .join('');
                selectorParts.unshift(part);
            }

            currentElement = currentElement.parentElement;
        }

        return selectorParts.join(' > ');
    }

    return buildAriaSelector(element);
}

function getAriaSelector2(element) {
    if (!element) return null;
  
    let ariaSelector = '';
  
    // Function to create a selector part for a given element
    function createSelectorPart(el) {
      let part = '';
  
      // Add role if present
      if (el.hasAttribute('role')) {
        part += `[role="${el.getAttribute('role')}"]`;
      }
  
      // Add ARIA attributes
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('aria-')) {
          part += `[${attr.name}="${attr.value}"]`;
        }
      });
  
      // If the part is still empty, use the tag name as a fallback
      if (!part) {
        part = el.tagName.toLowerCase();
      }
  
      return part;
    }
  
    // Traverse the DOM tree upwards to build the full selector
    let currentElement = element;
    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
      const selectorPart = createSelectorPart(currentElement);
      ariaSelector = selectorPart + (ariaSelector ? ' > ' + ariaSelector : '');
  
      currentElement = currentElement.parentElement;
    }
  
    return ariaSelector;
  }

function getAriaSelector3(element) {
    if (!element) return null;
  
    let selector = '';
  
    // Add role if present
    if (element.hasAttribute('role')) {
      selector += `[role="${element.getAttribute('role')}"]`;
    }
  
    // Add ARIA attributes
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('aria-') && attr.value) {
        selector += `[${attr.name}="${attr.value}"]`;
      }
    });
  
    // Add tag name as the base selector part
    if (!selector) {
      selector = element.tagName.toLowerCase();
    } else {
      selector = element.tagName.toLowerCase() + selector;
    }
  
    return selector;
  }

function getAriaSelector(element) {
    if (!element) return null;

    let selector = '';

    const ariaAttributes = ['aria-label', 'aria-labelledby', 'data-tid', 'placeholder'];

    ariaAttributes.forEach(attr => {
        if (element.hasAttribute(attr) && element.getAttribute(attr)) {
            selector += `[${attr}="${element.getAttribute(attr)}"]`;
        }
    })

    if(selector) { //If there is any aria attribute then add the role attribute
        if (element.hasAttribute('role') && element.getAttribute('role')) {
            selector += `[role="${element.getAttribute('role')}"]`;
        }
    }

    let tagName = element.tagName.toLowerCase();
    if (selector && tagName) { //If there is any aria attribute then add the tag name
        selector = tagName + selector;
        return selector;
    }
    return null;
}

function getArgSelector(element) {
    if (!element) return null;

    return 'Dynamic selector';

    let selector = '';
    let tagName = element.tagName.toLowerCase();
    
    if(tagName) {        
        if (element.hasAttribute('type') && element.getAttribute('type')) {
            selector = tagName;

            selector += `[type="${element.getAttribute('type')}"]`;

            if(element.hasAttribute('placeholder') && element.getAttribute('placeholder')) {
                selector += `[placeholder="${element.getAttribute('placeholder')}"]`;
            }

            if(element.hasAttribute('title') && element.getAttribute('title')) {
                selector += `[title="${element.getAttribute('title')}"]`;
            }

            if (element.hasAttribute('name') && element.getAttribute('name')) {
                selector += `[name="${element.getAttribute('name')}"]`;
            }

            if (element.hasAttribute('alt') && element.getAttribute('alt')) {
                selector += `[alt="${element.getAttribute('alt')}"]`;
            }

            if (element.hasAttribute('src') && element.getAttribute('src')) {
                selector += `[src="${element.getAttribute('src')}"]`;
            }           
            return selector;
        }
    }

    return null;
}

function generateXPath(element, root = document.body) {
    if (!element) return null;
    if (element.id) return `//*[@id="${element.id}"]`;
    if (element === root) return `//${element.tagName}`;
  
    const siblings = element.parentNode?.childNodes;  
    if(siblings) {
        let ix = 0;
        for (let index = 0; index < siblings.length; index += 1) {
            const sibling = siblings[index];  
            if (sibling === element) {
                return `${generateXPath(element.parentNode)}/${element.tagName.toLowerCase()}[${ix + 1}]`;
            }  
            if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                ix++;
            }
        }
    }
  
    return null;
}

function getCssPath(element) {
    if (element.nodeType !== Node.ELEMENT_NODE) {
        return '';
    }

    function idSelector(id) {
        return '#' + CSS.escape(id);
    }

    class Step {
        constructor(value, optimized) {
            this.value = value;
            this.optimized = optimized;
        }

        toString() {
            return this.value;
        }
    }

    function cssPathStep(node, isTargetNode) {
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return null;
        }
        const id = node.getAttribute('id');
        if (id) {
            return new Step(idSelector(id), true);
        }
        const nodeNameLower = node.nodeName.toLowerCase();
        if (['html', 'body', 'head'].includes(nodeNameLower)) {
            return new Step(nodeNameLower, true);
        }
        const nodeName = node.nodeName;
        const parent = node.parentNode;
        if (!parent || parent.nodeType === Node.DOCUMENT_NODE) {
            return new Step(nodeNameLower, true);
        }
        let needsClassNames = false;
        let needsNthChild = false;
        let ownIndex = -1;
        let elementIndex = -1;
        const siblings = parent.children;
        const ownClassNames = new Set(node.classList);
        for (
            let i = 0;
            (ownIndex === -1 || !needsNthChild) && i < siblings.length;
            i++
        ) {
            const sibling = siblings[i];
            if (sibling.nodeType !== Node.ELEMENT_NODE) {
                continue;
            }
            elementIndex += 1;
            if (sibling === node) {
                ownIndex = elementIndex;
                continue;
            }
            if (sibling.nodeName !== nodeName) {
                continue;
            }
            needsClassNames = true;
            if (!ownClassNames.size) {
                needsNthChild = true;
                continue;
            }
            const siblingClassNames = new Set(sibling.classList);
            for (const siblingClass of siblingClassNames) {
                if (!ownClassNames.has(siblingClass)) {
                    continue;
                }
                ownClassNames.delete(siblingClass);
                if (!ownClassNames.size) {
                    needsNthChild = true;
                    break;
                }
            }
        }
        let result = nodeNameLower;
        if (
            isTargetNode &&
            nodeName.toLowerCase() === 'input' &&
            node.getAttribute('type') &&
            !node.getAttribute('id') &&
            !node.getAttribute('class')
        ) {
            result += `[type=${CSS.escape(node.getAttribute('type'))}]`;
        }
        if (needsNthChild) {
            result += `:nth-child(${ownIndex + 1})`;
        } else if (needsClassNames) {
            for (const className of ownClassNames) {
                result += '.' + CSS.escape(className);
            }
        }
        return new Step(result, false);
    }

    const steps = [];
    let currentNode = element;
    while (currentNode) {
        const step = cssPathStep(currentNode, currentNode === element);
        if (!step) {
            break;
        }
        steps.push(step);
        if (step.optimized) {
            break;
        }
        currentNode = currentNode.parentNode;
    }
    steps.reverse();
    return steps.join(' > ');
}

////////////////////
// From npm install @medv/finder
////////////////////
function getSelector(element) {
    let cssSelector = null;
    try {
        const ariaAttrs = ['data-testid', 'data-tid', 'data-test-id', 'data-test'];
        cssSelector = getCssSelector(element, {
            root: document.body,          // Root of search, defaults to document.body.
            idName: (name) => true,       // Check if this ID can be used.
            className: (name) => true,    // Check if this class name can be used.
            tagName: (name) => true,      // Check if tag name can be used.
            attr: (name, value) => name === 'id' || (ariaAttrs.includes(name) && value),
            seedMinLength: 1,
            optimizedMinLength: 3,
            threshold: 3000,
            maxNumberOfTries: 30_000,
            timeoutMs: undefined
        });

        const tag = element.tagName.toLowerCase();
        if (!cssSelector.startsWith(tag) && !cssSelector.includes(' ')) {
            cssSelector = `${tag}${cssSelector}`;
        }
        return cssSelector;
    }
    catch (e) {
        console.log(e);
        return null;
    }
    function getCssSelector(element, options) {
        const defaultOptions = {
            root: document.body,
            idName: () => true,
            className: () => true,
            tagName: () => true,
            attr: () => false,
            seedMinLength: 1,
            optimizedMinLength: 2,
            threshold: 1000,
            maxNumberOfTries: 10000,
            timeoutMs: undefined
        };

        const config = { ...defaultOptions, ...options };

        if (element.nodeType !== Node.ELEMENT_NODE) {
            throw new Error("Can't generate CSS selector for non-element node type.");
        }

        if (element.tagName.toLowerCase() === "html") {
            return "html";
        }

        const startTime = new Date();
        const root = getRootNode(config.root, defaultOptions);

        function getRootNode(node, root) {
            return node.nodeType === Node.DOCUMENT_NODE ? node : node === root.root ? node.ownerDocument : node;
        }

        function generateSelector(target, mode, fallback) {
            let selector = null;
            let elementsList = [];
            let currentElement = target;
            let level = 0;

            while (currentElement) {
                const elapsedTime = (new Date).getTime() - startTime.getTime();
                if (config.timeoutMs !== undefined && elapsedTime > config.timeoutMs) {
                    throw new Error(`Timeout: Can't find a unique selector after ${elapsedTime}ms`);
                }

                let candidates = g(getIdSelector(currentElement)) || g(...getClassSelectors(currentElement)) || g(...getAttributeSelectors(currentElement)) || g(getTagNameSelector(currentElement)) || [{ name: "*", penalty: 3 }];
                const nthChildIndex = getNthChildIndex(currentElement);

                if (mode === "all" && nthChildIndex) {
                    candidates = candidates.concat(candidates.filter(isNotUniversal).map(selector => applyNthChild(selector, nthChildIndex)));
                } else if (mode === "two") {
                    candidates = candidates.slice(0, 1);
                    if (nthChildIndex) {
                        candidates = candidates.concat(candidates.filter(isNotUniversal).map(selector => applyNthChild(selector, nthChildIndex)));
                    }
                } else if (mode === "one") {
                    const [firstCandidate] = candidates.slice(0, 1);
                    if (nthChildIndex && isNotUniversal(firstCandidate)) {
                        candidates = [applyNthChild(firstCandidate, nthChildIndex)];
                    }
                } else if (mode === "none") {
                    candidates = [{ name: "*", penalty: 3 }];
                    if (nthChildIndex) {
                        candidates = [applyNthChild(candidates[0], nthChildIndex)];
                    }
                }

                for (let candidate of candidates) {
                    candidate.level = level;
                }

                elementsList.push(candidates);
                if (elementsList.length >= config.seedMinLength && (selector = findSelector(elementsList, fallback))) {
                    break;
                }

                currentElement = currentElement.parentElement;
                level++;
            }

            return selector || findSelector(elementsList, fallback);
        }

        function findSelector(elementsList, fallback) {
            const permutations = [...getPermutations(elementsList)];
            const sortedPermutations = sortPermutations(permutations);

            if (sortedPermutations.length > config.threshold) {
                return fallback ? fallback() : null;
            }

            for (let permutation of sortedPermutations) {
                if (isUnique(permutation)) {
                    return permutation;
                }
            }

            return null;
        }

        function serializeSelector(selector) {
            let firstElement = selector[0];
            let serialized = firstElement.name;
            for (let i = 1; i < selector.length; i++) {
                const level = selector[i].level || 0;
                serialized = firstElement.level === level - 1 ? `${selector[i].name} > ${serialized}` : `${selector[i].name} ${serialized}`;
                firstElement = selector[i];
            }
            return serialized;
        }

        function getIdSelector(element) {
            const id = element.getAttribute("id");
            return id && config.idName(id) ? { name: `#${CSS.escape(id)}`, penalty: 0 } : null;
        }

        function getClassSelectors(element) {
            return Array.from(element.classList).filter(config.className).map(className => ({ name: `.${CSS.escape(className)}`, penalty: 1 }));
        }

        function getAttributeSelectors(element) {
            const attributes = Array.from(element.attributes).filter(attr => config.attr(attr.name, attr.value));
            return attributes.map(attr => ({ name: `[${CSS.escape(attr.name)}="${CSS.escape(attr.value)}"]`, penalty: 0.5 }));
        }

        function getTagNameSelector(element) {
            const tagName = element.tagName.toLowerCase();
            return config.tagName(tagName) ? { name: tagName, penalty: 2 } : null;
        }

        function getNthChildIndex(element) {
            const parent = element.parentNode;
            if (!parent) return null;

            let sibling = parent.firstChild;
            if (!sibling) return null;

            let index = 0;
            while (sibling) {
                if (sibling.nodeType === Node.ELEMENT_NODE) {
                    index++;
                }
                if (sibling === element) break;
                sibling = sibling.nextSibling;
            }
            return index;
        }

        function applyNthChild(selector, index) {
            return { name: `${selector.name}:nth-child(${index})`, penalty: selector.penalty + 1 };
        }

        function isNotUniversal(selector) {
            return selector.name !== "*" && !selector.name.startsWith("#");
        }

        function isUnique(selector) {
            let itr = 0;
            const maxTries = 5;
            do {
                const serialized = serializeSelector(selector);
                switch (root.querySelectorAll(serialized).length) {
                    case 0:
                        itr++;
                    case 1:
                        return true;
                    default:
                        return false;
                }
            }while (itr < maxTries);

            if(itr >= maxTries) {
                throw new Error(`Can't select any node with this selector: ${serialized}`);
            }
        }

        function g(...selectors) {
            const filtered = selectors.filter(Boolean);
            return filtered.length > 0 ? filtered : null;
        }

        function sortPermutations(permutations) {
            return permutations.sort((a, b) => calculatePenalty(a) - calculatePenalty(b));
        }

        function calculatePenalty(selector) {
            return selector.map(item => item.penalty).reduce((sum, penalty) => sum + penalty, 0);
        }

        function* getPermutations(elementsList, currentPermutation = []) {
            if (elementsList.length > 0) {
                for (let element of elementsList[0]) {
                    yield* getPermutations(elementsList.slice(1), currentPermutation.concat(element));
                }
            } else {
                yield currentPermutation;
            }
        }

        function* optimizePermutations(permutations, targetElement, state = { counter: 0, visited: new Map() }) {
            if (permutations.length > 2 && permutations.length > config.optimizedMinLength) {
                for (let i = 1; i < permutations.length - 1; i++) {
                    if (state.counter > config.maxNumberOfTries) return;

                    state.counter++;
                    const newPermutations = [...permutations];
                    newPermutations.splice(i, 1);
                    const serialized = serializeSelector(newPermutations);

                    if (state.visited.has(serialized)) return;

                    if (isUnique(newPermutations) && verifySelector(newPermutations, targetElement)) {
                        yield newPermutations;
                        state.visited.set(serialized, true);
                        yield* optimizePermutations(newPermutations, targetElement, state);
                    }
                }
            }
        }

        function verifySelector(selector, targetElement) {
            return root.querySelector(serializeSelector(selector)) === targetElement;
        }

        let selector = generateSelector(element, "all", () => generateSelector(element, "two", () => generateSelector(element, "one", () => generateSelector(element, "none"))));

        if (selector) {
            const optimizedSelectors = [...optimizePermutations(selector, element)];
            if (optimizedSelectors.length > 0) {
                selector = optimizedSelectors[0];
            }
            return serializeSelector(selector);
        }

        throw new Error("Selector was not found.");
    }
}
////////////////////
////////////////////

function getSelector2(element)
{
    const path = [];
    
    if (element.nodeType === Node.TEXT_NODE)
        element = element.parentElement;

    if (element.nodeType !== Node.ELEMENT_NODE)
        return false;

    while (element && element !== document.documentElement) {
        let tagName = element.nodeName.toLowerCase();
        let parent = element.parentElement;

        if (element.id) {
            if (!document.querySelector(`#${element.id}`).matches(tagName)) {
                path.unshift(`[id="${element.id}"]`);
            } else {
                path.unshift(`#${element.id}`);
                break; // Stop traversing if id is unique
            }
        } else {
            let siblings = Array.from(parent.children).filter(el => el.nodeName.toLowerCase() === tagName);

            if (siblings.length === 1) {
                path.unshift(tagName);
            } else {
                let index = Array.from(parent.children).indexOf(element) + 1;
                path.unshift(`${tagName}:nth-child(${index})`);
            }
        }

        element = parent;
    }

    return path.length ? path.join(" > ") : false;
}

// Extract target elements href attribute, if not exists then check for closest/ancestor anchor tag
function findUrlTarget(element) {
    return element.href || element.closest('a')?.href || '';
}

function findAttributeOrParent(element, attributeName) {
    if (element.hasAttribute(attributeName)) {
        return element.getAttribute(attributeName);
    }
    let currentElement = element;
    while (currentElement.parentElement) {
        const parent = currentElement.parentElement;

        // Check if the current element is the sole child of its parent
        if (parent.children.length === 1) {
            if (parent.hasAttribute(attributeName)) {
                return parent.getAttribute(attributeName);
            }
            currentElement = parent;
        } else {
            break;
        }
    }
    return '';
}

function extractAttributes(element) {
    let attributes = {};
    for (let attr of element.attributes) {
        attributes[attr.name] = attr.value;
    }
    try {
        attributes['innerText'] = element.innerText || element.textContent || '';
        attributes['tagName'] = element.tagName.toLowerCase() || '';
        attributes['id'] = findAttributeOrParent(element, 'id');
        // try{ attributes['id'] = element.closest('[id]')?.id || ''; } catch(e) {  console.log(e); }
        // try { attributes['id'] = element.id || ''; } catch (e) { console.log(e); }
        attributes['value'] = element.value || '';
    }
    catch(e) {
        console.log(e);
    }
    //filter out null or empty string attributes
    attributes = Object.fromEntries(Object.entries(attributes).filter(([key, value]) => value !== null && (typeof value !== 'string' || (typeof value === 'string' && value.trim() !== ''))));
    return attributes;
}

function extractAttributes1(element) {
    return {
          tagName: element.tagName.toLowerCase(),
          id: element.closest('[id]')?.id || '',
          className: element.className,
          text: element.innerText || element.textContent,
          value: element.value,
          name: element.name,
          type: element.type,
          ariaLabel: element.getAttribute('aria-label'),
          href: findUrlTarget(element),
          src: element.src,
          alt: element.alt,
          title: element.title,
          placeholder: element.getAttribute('placeholder') || element.closest('[placeholder]')?.placeholder || '',
          checked: element.checked,
          selected: element.selected,
          disabled: element.disabled,
          readonly: element.readOnly,
          required: element.required
    };
}

function toCamelCase(str, capitalize = false) {
    const result = str.replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => {
        return index === 0 && !capitalize
            ? letter.toLowerCase()
            : letter.toUpperCase();
    });

    return result.replace(/\s+|[-]/g, '');
}

function recordPressedKey({ repeat, shiftKey, metaKey, altKey, ctrlKey, key }) {
    const modifierKeys = ['Control', 'Alt', 'Shift', 'Meta'];
    return new Promise((resolve, reject) => {
        if (repeat || modifierKeys.includes(key)) return resolve(null);

        let pressedKey = key.length > 1 || shiftKey ? toCamelCase(key, true) : key;
        
        if (pressedKey.length > 1) {
            const keys = [pressedKey];

            if (shiftKey) keys.unshift('Shift');
            if (metaKey) keys.unshift('Meta');
            if (altKey) keys.unshift('Alt');
            if (ctrlKey) keys.unshift('Control');
            resolve(keys);
        }
        else {
            resolve(null);
        }
    });
}

function handleMouseOver(event) {
    chrome.storage.local.get(['recStarted'], function(result) {
        recStarted = result.recStarted || false;
        if (recStarted) {
            const target = event.target;
            chrome.storage.local.get(['currentOverlay'], function(result) {
                if (result.currentOverlay) {
                    removeHighlight(document.querySelector(`.highlight-overlay`));
                }
                highlightElement_Record(target);
                chrome.storage.local.set({ currentOverlay: true });    
            });
        }
    });
}

function handleMouseOut(event) {
    chrome.storage.local.get(['recStarted'], function(result) {
        recStarted = result.recStarted || false;
        if (recStarted) {
            chrome.storage.local.get(['currentOverlay'], function(result) {
                if (result.currentOverlay) {
                    removeHighlight(document.querySelector(`.highlight-overlay`));
                    chrome.storage.local.set({ currentOverlay: false });
                }
            });
        }
    });
}

// Function to send a message and wait for the response
function sendMessagePromise(message)
{
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, response => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError.message);
            } else {
                resolve(response);
            }
        });
    });
}

function getHumanReadablePath(element)
{
  let parts = [];

  if (!element) {
      return '';
  }

  while (element) {
      let part = '';
      //if there is tagName then make it lower case
      if (element.tagName) {
          part += element.tagName.toLowerCase();
      }

      if (element.id) {
          part += `#${element.id}`;
      } else if (element.className && typeof element.className === 'string') {
          part += `.${element.className.trim().replace(/\s+/g, '.')}`;
      } else if (element.name) {
          part += `[name="${element.name}"]`;
      }

      parts.push(part);
      element = element.parentElement;
  }

  return parts.reverse().join(' > ');
}

function getAllSelectors(element) {
    const ariaSelector = getAriaSelector(element);
    const cssSelector = getSelector(element);
    const cssPath = getCssPath(element);
    const cssSingleSelector = getSingleSelector(element);
    const argSelector = getArgSelector(element);

    let selectorObject = {
        'ariaSelector': ariaSelector,
        'cssSelector': cssSelector,
        'singleSelector': cssSingleSelector,
        'xPath': generateXPath(element),
        'cssPath': cssPath,
        'argSelector': argSelector
    };
    // Filter out null or empty string values
    let filteredSelectorObject = {};

    for (let key in selectorObject) {
        if (selectorObject[key] !== null && selectorObject[key] !== '') {
            filteredSelectorObject[key] = selectorObject[key];
        }
    }
    return filteredSelectorObject;
}

function deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) return false;
  
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
  
    if (keys1.length !== keys2.length) return false;
  
    for (let key of keys1) {
      if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) return false;
    }
  
    return true;
  }

  const eventQueue = [];
  let isProcessing = false;
  let lastFocusInElement = null;
  let captureEvent = false;
  let valueOnFocusIn = '';
  let lastFocusInTime = 0;

  // Wrapper functions to store references
  const changeListener = event => queueEvent(event, 'change');
  const clickListener = event => queueEvent(event, 'click');
  const keydownListener = event => queueEvent(event, 'keydown');
  //const focusinListener = event => {queueEvent(event, 'focusin'); observeElement(event.target);};
  const focusinListener = event => queueEvent(event, 'focusin');
  const focusoutListener = event => queueEvent(event, 'focusout'); 
  const inputListener = event => queueEvent(event, 'input');

  const copyListener = event => queueEvent(event, 'copy');
  const pasteListener = event => queueEvent(event, 'paste');
  
  function queueEvent(event, eventType) {
    if (eventType === 'keydown') {
        if (event.repeat) return;
    } else if (eventType === 'focusin' || eventType === 'focusout') {
        let element = event.target;
        let var_isTextInputField = isTextInputField(element);
        let var_isDropdown = isDropdown(element);
        let var_isCheckboxOrRadio = isCheckboxOrRadio(element);
        if (!var_isTextInputField && !var_isDropdown && !var_isCheckboxOrRadio) return;
    }    
    eventQueue.push({ event, eventType });
    processQueue();
  }

  async function processQueue() {
    //if (isProcessing && eventQueue.length < 10) return; //??
    if (isProcessing) return;
    isProcessing = true;

    while (eventQueue.length > 0) {
        const { event, eventType } = eventQueue.shift();
        //console.error('Processing event:', eventType);
        await actionRecorder(event, eventType);
    }

    isProcessing = false;
  }

  async function actionRecorder(event, eventType) {
    return new Promise(async (resolve) => {

        const element = event.target;
        //const eventType = event.type;
        const isCtrlKey = event.ctrlKey;
        const isShiftKey = event.shiftKey;
        if (eventType === 'click') {
            if (isCtrlKey || isShiftKey) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        }
        const result = await chrome.storage.local.get(['recStarted']);
        const recStarted = result.recStarted || false;
        if (!recStarted) return resolve();

        if (eventType === 'input') {
            captureEvent = false;
            return resolve();
        }

        const urlTarget = findUrlTarget(element);

        let value = '';
        let options =  null;

        let var_isTextInputField = isTextInputField(element);
        let var_isDropdown = isDropdown(element);
        let var_isCheckboxOrRadio = isCheckboxOrRadio(element);

        if (var_isTextInputField) {
            value = element.isContentEditable ? element.innerText : element.value || '';
        } else if(var_isDropdown) {
            try{
                // if(element.selectedOptions) {
                //     options = Array.from(element.selectedOptions).map(option => option.value).join(', ') || '';
                //     value = element.selectedOptions[0].innerText || '';
                // }
                // else if(element.innerText) {
                //     value = element.innerText;
                // }
                // else {
                //     value = element.textContent || '';
                // }
        
                if (element.tagName.toLowerCase() === 'select' && element.options) {
                    options = Array.from(element.options).map(option => option.text || option.value);
                    if (element.selectedOptions && element.selectedOptions.length > 0) {
                        value = element.selectedOptions[0].text || element.selectedOptions[0].value || '';
                    }
                }
                else if (element.innerText) {
                    value = element.innerText;
                } 
                else {
                    value = element.textContent || '';
                }
        
                //console.log('Options:', options);
                //console.log('Selected Value:', value);                
            } catch(e) {
                console.log(e);
            }
        } else if(var_isCheckboxOrRadio) {
            value = element.checked || false;
        } else {
            value = element.innerText || element.textContent || element.value || element.getAttribute('aria-label') || element.getAttribute('alt') || ''
        }

        const recordedEvent = {
            type: eventType, //event.type,
            URL: window.location.href,
            title: document.title,
            selectors: getAllSelectors(element),
            urlTarget: urlTarget,
            attributes: extractAttributes(element),
            value: value
        };

        if (options) {
            recordedEvent.options = options;
        }

        if (eventType === 'click') {
            //if(var_isTextInputField || var_isDropdown || var_isCheckboxOrRadio) {
                //return resolve();
            //}

            if (isCtrlKey || isShiftKey) {
                if (isCtrlKey) { //if ctrl key is pressed along with click then record the event as  
                    recordedEvent.type = 'get_results';
                    recordedEvent.nResults = 1;
                }
                else if (isShiftKey) { //if shift key is pressed along with click then record the event as get_search_results
                    recordedEvent.type = 'get_search_results';
                    recordedEvent.nResults = 5;
                }
            } else {
                const rect = element.getBoundingClientRect();
                if (event.clientX && event.clientY) {
                    recordedEvent.offsetX = event.clientX - rect.left;
                    recordedEvent.offsetY = event.clientY - rect.top;
                }

                if (isForm(element)) {
                    recordedEvent.type = 'click-update';
                    recordedEvent.value = element.value || '' //element.innerText || ''
                } else if (isLink(element)) {
                    recordedEvent.type = 'click-link';
                    recordedEvent.value = element.href || element.getAttribute("href") || '' //|| element.innerText || element.textContent || '';	
                } else { //if (isClickableButton(element)) {
                    recordedEvent.type = 'click';
                    recordedEvent.value = value;//element.innerText || element.value || ''
                }
            }
        } else if (eventType === 'copy') {
            const selection = window.getSelection().toString();
            recordedEvent.value = selection;

            event.preventDefault();
            event.clipboardData.setData('text/plain', selection);
        } else if (eventType === 'paste') {
            const pastedText = (event.clipboardData || window.clipboardData).getData('text');
            recordedEvent.value = pastedText;
        } else if (eventType === 'keydown') {
            if (event.repeat) return resolve(); //key is being held down such that it is automatically repeating

            let keys = null;
            const keysArr = await recordPressedKey(event);

            if (keysArr && keysArr.length > 0) {
                keys = keysArr[0];

                if(keys === 'Enter' || keys === 'ArrowDown' || keys === 'ArrowUp' || keys === 'ArrowLeft' || keys === 'ArrowRight') {
                    recordedEvent.value = keys;
                }
                else{
                    return resolve();
                }

                //keys = keysArr.join('+');
                //console.log('Keys:', keys);

                // if (isTextInputField(element)) {
                //     if(keys.includes('Enter') && value) {
                //         recordedEvent.value = 'Enter' + '###' + value; //keys + '###' + value;
                //     }
                //     else {
                //         recordedEvent.type = 'change';
                //     }
                // }
                // else{
                //    recordedEvent.value = keys;
                //}
            } else {
                //recordedEvent.type = 'change';
                return resolve();
            }
        } else if (eventType === 'focusin') {
            try{
                if (!var_isTextInputField && !var_isDropdown && !var_isCheckboxOrRadio) {
                    return resolve();
                }
                if(!element) {
                    return resolve();
                }

                valueOnFocusIn = recordedEvent.value;
                // await chrome.storage.local.set({ valueOnFocusIn: value }); //, selectorsOnFocusIn: recordedEvent.selectors });
                lastFocusInElement = element;
                captureEvent = true;
                
                element.addEventListener('input', inputListener, true);
                return resolve();
            } catch(e) {
                console.log(e);
                return resolve();
            }
        } else if (eventType === 'focusout') {
            if (!var_isTextInputField && !var_isDropdown && !var_isCheckboxOrRadio) {
                return resolve();
            }
            if(!element) {
                console.error('Element is null');
                return resolve();
            }

            if(lastFocusInElement === element) {
                element.removeEventListener('input', inputListener, true);
            }

            if(captureEvent === false || lastFocusInElement !== element || valueOnFocusIn === recordedEvent.value || lastFocusInElement === null) {
                return resolve();
            }
            if (var_isTextInputField) {
                recordedEvent.type = 'change'; //value already recorded
            } else if (var_isDropdown) {
                recordedEvent.type = 'dropdown';
            } else if (var_isCheckboxOrRadio) {
                recordedEvent.type = 'check';
            } else if (element.tagName.toLowerCase() === 'input' && element.type.toLowerCase() === 'file') {
                recordedEvent.value = element.files.length > 0 ? element.files[0].name : '';
                recordedEvent.type = 'upload-file';
            } else {
                return resolve();
            }
        } else if (eventType === 'change') {
            //console.log('change1');
            if (var_isTextInputField) {
                ;//recordedEvent.type = 'change'; //value already recorded
            } else if (var_isDropdown) {
                recordedEvent.type = 'dropdown';
            } else if (var_isCheckboxOrRadio) {
                recordedEvent.type = 'check';
            } else if (element.tagName.toLowerCase() === 'input' && element.type.toLowerCase() === 'file') {
                recordedEvent.value = element.files.length > 0 ? element.files[0].name : '';
                recordedEvent.type = 'upload-file';
            } else {
                //console.error('change2');
                return resolve();
            }

            const resEvents = await chrome.storage.local.get(['events']);
            const events = resEvents.events || [];
            let iPos = -1;
            let i = events.length - 1; 
            //console.error('change3');
            try {
                while (i >= 0) {
                    const lastEvent = events[i];
                    if (lastEvent.type === 'keydown' && (
                        ( (i === (events.length - 1)) && (lastFocusInElement === element || lastFocusInElement === null)) ||
                        ( (i !== (events.length - 1)) && deepEqual(lastEvent.selectors, recordedEvent.selectors) && deepEqual(lastEvent.attributes, recordedEvent.attributes)) 
                        )
                       ) {
                        console.log(`Last Event type: ${lastEvent.type}, Current Event type: ${recordedEvent.type}, i/length: ${i}/${events.length}`);
                        iPos = i;
                    } else {
                        //console.error('change4');
                        break;
                    }
                    i--;
                }
                
                if (iPos !== -1) {
                    //console.error('change5');
                    

                    if (iPos > 0) {
                        //const lastEvent = events[iPos - 1];
                        //if (lastEvent.URL === recordedEvent.URL || lastEvent.URL === '') {
                            recordedEvent.URL = '';
                        //}
                    }

                    // add the event before the last keydown event
                    events.splice(iPos, 0, recordedEvent);
                    //console.error('change6');
                    await chrome.storage.local.set({ events: events });
                    //console.error('change7');
                    try {
                        const response = await sendMessagePromise('Refresh');
                        if (response.status === "success") {
                            console.log("Action succeeded:", response);
                        } else {
                            console.error("Action failed:", response.message);
                        }
                    } catch (error) {
                        console.error("Error during message sending:", error);
                    }

                    //console.error('change8');
                    return resolve();
                }   
            }catch(e) {
                console.log(e);
                //console.error('change9');
                if (iPos !== -1) {
                    //console.error('change10');
                    return resolve();
                }
            }
        }

        try {
            //console.error(`Sending message: ${recordedEvent.type}`);
            const response = await sendMessagePromise(recordedEvent);
            //console.error(`Response: ${response}`);
            if (response.status === "success") {
                console.log("Action succeeded:", response);
                // Handle success
            } else {
                console.error("Action failed:", response.message);
                // Handle error
            }
        } catch (error) {
            console.error("Error during message sending:", error);
        }
        resolve();
    });
  }


// let observer = null;
// const observedElements = new Set();
// const initializeObserver = () => {
//     if (!observer) {
//         observer = new MutationObserver((mutationsList) => {
//             for (const mutation of mutationsList) {
//                 if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
//                     const element = mutation.target;
//                     if (isTextInputField(element)) {
//                         //recordEvent('input', element);
//                         console.log(`Attribute Mutation: ${mutation.attributeName}`);
//                     }
//                 }
//             }
//         });
//     }
// };

// function recordEvent(type, element) {
//     const event = new Event(type, { bubbles: true });
//     element.dispatchEvent(event);
// }

// function observeElement(element) {
//   if (isTextInputField(element) && !observedElements.has(element)) {
//     console.log('Observing element:', element);
    
//     //const config = { childList: true, characterData: true, subtree: true, attributes: true, attributeOldValue: true, characterDataOldValue: true};
//     //observer.observe(element, config);

//     observer.observe(element, { attributes: true, attributeFilter: ['value'] });
//     observedElements.add(element);
//     if (!element._inputEventAdded) {
//         element.addEventListener('input', handleInputEvent);
//         element._inputEventAdded = true; // Flag to indicate the listener is added
//     }
//   }
// }

// // Handle input event for value changes
// function handleInputEvent(event) {
//     const element = event.target;
//     if (isTextInputField(element)) {
//         recordEvent('input', element);
//     }
// }

function cleanupListeners()
{
    document.removeEventListener("change", changeListener, true);
    document.removeEventListener("click", clickListener, true);
    document.removeEventListener("keydown", keydownListener, true);
    document.removeEventListener("focusin", focusinListener, true);
    document.removeEventListener("focusout", focusoutListener, true);
    document.removeEventListener('copy', copyListener, true);
    window.removeEventListener('paste', pasteListener, true);

    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);

    //document.removeEventListener('focusin', onFocusIn, true);
    //document.removeEventListener('focusout', onFocusOut, true);

    // if (observer) {
    //     observer.disconnect();
    //     observer = null;
    //     observedElements.clear();
    // }
}

async function startRecording(isStart) {
    //console.log(`Recording ${isStart ? 'Started' : 'Stopped'}`);
    cleanupListeners();

    if (isStart) {
        //initializeObserver();

        document.addEventListener("change", changeListener, true);
        document.addEventListener("click", clickListener, true);
        document.addEventListener("keydown", keydownListener, true);
        document.addEventListener("focusin", focusinListener, true);
        document.addEventListener("focusout", focusoutListener, true);
        document.addEventListener('copy', copyListener, true);
        window.addEventListener('paste', pasteListener, true);

        //document.body.catchSingleEvent('click', actionRecorderClick);s
        //document.body.catchSingleEvent('focusout', actionRecorderFocusOut);

        document.addEventListener('mouseover', handleMouseOver, true);
        document.addEventListener('mouseout', handleMouseOut, true);


        //if (isTextInputField(document.activeElement)) {
        //    onFocusIn(document.activeElement);
        //}

        //document.addEventListener('focusin', onFocusIn, true);
        //document.addEventListener('focusout', onFocusOut, true);

        //Input event: live validation
        //Change event: final validation (for <input> (except "radio" "checkbox"), <textarea>, and <select>)
    }
}

// Function to evaluate XPath and return the element
function getElementByXPath(xpath)
{
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function setInputValue_cssSelector(value)
{
    const cssSelectors = [
        "#APjFqb",              // Google
        "#p_email",             // Facebook
        "#search_form_input_homepage", // DuckDuckGo
        "#search",              // Yahoo
        "#ybar-sbq",            // Yahoo
        "#query",               // Bing
        "#sb_form_q",           // Bing
        "#search_form_input",   // Startpage
        "#key",                 // jd.com
        "#q",                   // tmall.com
        "#twotabsearchtextbox", // amazon.com
        "#kw"                   // baidu.com
    ];

    for (const cssSelector of cssSelectors) {
        const inputElement = document.querySelector(cssSelector);
        if (inputElement) {
            inputElement.value = value;
            const event = new Event('input', { bubbles: true });
            inputElement.dispatchEvent(event);

            // Ensure focus on input element
            inputElement.focus();

            // Simulate "Enter" key press event
            const keyboardEvent = new KeyboardEvent('keydown', {
                code: 'Enter',
                key: 'Enter',
                charCode: 13,
                keyCode: 13,
                view: window,
                bubbles: true
            });

            inputElement.dispatchEvent(keyboardEvent);

            clickFirstSearchResult();
            return { status: "success" };
        }
    }
    return { status: "error", message: "No input element found with any of the specified css Selectors." };
}

//Function to click a button with the specified text
function clickButtonWithText(text)
{
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
        if (button.innerText === text) {
            button.click();
            return { status: "success" };
        }
    }
    return { status: "error", message: "No button found with the specified text" };
}

//Function to click a link with the specified text
function clickLinkWithText(text)
{
    const links = document.querySelectorAll('a');
    for (const link of links) {
        if (link.innerText === text) {
            link.click();
            return { status: "success" };
        }
    }
    return { status: "error", message: "No link found with the specified text" };
}

chrome.storage.local.get(['recStarted'], async function(result) {
    //debugger;
    recStarted = result.recStarted || false;
    await startRecording(recStarted);
    //console.log('WebAI UI Event recorder is running : ', recStarted);
});

//  })();