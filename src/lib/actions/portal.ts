/** Moves an element to document.body so fixed overlays cover the full viewport. */
export function portal(node: HTMLElement) {
  document.body.appendChild(node);

  return {
    destroy() {
      node.remove();
    }
  };
}
