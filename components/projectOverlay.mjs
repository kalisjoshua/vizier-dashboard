const NAME = "cc-project-overview";

export const getOverlay = () => inDOM(`[is="${NAME}"]`);

/*
https://sonarcloud.io/api/project_badges/measure?project=visitingmedia_ttx-backend&metric=alert_status&token=fd5a3fcced077e6507b1b610d0c88c64779b682d
https://sonarcloud.io/api/project_badges/measure?project=visitingmedia_ttx-backend&metric=bugs&token=fd5a3fcced077e6507b1b610d0c88c64779b682d
https://sonarcloud.io/api/project_badges/measure?project=visitingmedia_ttx-backend&metric=code_smells&token=fd5a3fcced077e6507b1b610d0c88c64779b682d
https://sonarcloud.io/api/project_badges/measure?project=visitingmedia_ttx-backend&metric=coverage&token=fd5a3fcced077e6507b1b610d0c88c64779b682d
https://sonarcloud.io/api/project_badges/measure?project=visitingmedia_ttx-backend&metric=coverage&token=fd5a3fcced077e6507b1b610d0c88c64779b682d
https://sonarcloud.io/api/project_badges/measure?project=visitingmedia_ttx-backend&metric=ncloc&token=fd5a3fcced077e6507b1b610d0c88c64779b682d
https://sonarcloud.io/api/project_badges/measure?project=visitingmedia_ttx-backend&metric=reliability_rating&token=fd5a3fcced077e6507b1b610d0c88c64779b682d
https://sonarcloud.io/api/project_badges/measure?project=visitingmedia_ttx-backend&metric=security_rating&token=fd5a3fcced077e6507b1b610d0c88c64779b682d
https://sonarcloud.io/api/project_badges/measure?project=visitingmedia_ttx-backend&metric=sqale_index&token=fd5a3fcced077e6507b1b610d0c88c64779b682d
https://sonarcloud.io/api/project_badges/measure?project=visitingmedia_ttx-backend&metric=sqale_rating&token=fd5a3fcced077e6507b1b610d0c88c64779b682d
https://sonarcloud.io/api/project_badges/measure?project=visitingmedia_ttx-backend&metric=vulnerabilities&token=fd5a3fcced077e6507b1b610d0c88c64779b682d



alert_status
bugs
code_smells
coverage
ncloc
reliability_rating
security_rating
sqale_index
sqale_rating
vulnerabilities



https://sonarcloud.io/api/project_badges/measure?project=visitingmedia_ttx-frontend&metric=alert_status&token=90307afb036ff0e039439001aeabc5197f394f7c



*/

class Overlay extends HTMLElement {
  constructor() {
    super();

    console.log("Hello from Overlay", this);
  }

  connectedCallback() {}
}

customElements.define(NAME, Overlay, { extends: "figure" });
