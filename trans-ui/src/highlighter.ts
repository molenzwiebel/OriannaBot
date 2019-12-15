
const STYLE = `
    border: 1px solid red;
`;

const styleElement = document.createElement("style");
document.head.appendChild(styleElement);

let highlightedClass: string | null = "";

/**
 * Adds a custom style to all span elements on the page with the specified
 * class name.
 */
export function highlightClass(clazz: string) {
    if (highlightedClass === clazz) return;
    if (highlightedClass) removeHighlight(highlightedClass);

    styleElement.innerHTML = `.translation.${clazz} { ${STYLE} }`;
    highlightedClass = clazz;
}

/**
 * Removes the highlight from all classes.
 */
export function removeHighlight(clazz: string) {
    if (highlightedClass !== clazz) return;
    styleElement.innerHTML = "";
    highlightedClass = null;
}