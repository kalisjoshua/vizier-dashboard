const NAME = "cc-project-overview";

export const getOverview = () => inDOM(`[is="${NAME}"]`);

class Overview extends HTMLElement {
  connectedCallback() {}
}

customElements.define(NAME, Overview, { extends: "figure" });
