const sonarBadges = {
  coverage: "Code coverage percentage",
  code_smells: "Code that could likely be improved",

  alert_status: "Quality gate status",

  bugs: "Bugs/reliability - count; based on Clean Code principals",
  reliability_rating: "Bugs/reliability - grade; based on the makeup of: types, count, and project size",

  vulnerabilities: "Security/vulnerability - count; based on Clean Code principals",
  security_rating: "Security/vulnerability - grade; based on the makeup of: types, count, and project size",

  sqale_index: "Maintainability/tech-debt - count; based on Clean Code principals",
  sqale_rating: "Maintainability/tech-debt - grade; based on the makeup of: types, count, and project size",

  ncloc: "Number of lines of code",
};

const sonarBadgeURL = (org, repo, token, metric) =>
  `https://sonarcloud.io/api/project_badges/measure?project=${org}_${repo}&metric=${metric}&token=${token}`;

export function displayOverview(org, reposConfig) {
  const panel = inDOM("#projects-overview");

  panel.setAttribute("open", true);
  panel.style.visibility = "visible";

  inDOM("#overview-badges").innerHTML = Object.entries(reposConfig)
    .map(([repo, { sonar }]) => {
      const cells = Object.keys(sonarBadges)
        .map(
          (metric) =>
            `<figure style="margin: 0; padding: 2px 0;">
              <img
                alt="${sonarBadges[metric]}"
                src="${sonarBadgeURL(org, repo, sonar, metric)}"
                title="${sonarBadges[metric]}"
              />
            </figure>`
        )
        .join("\n");

      return `
        <div style="background: rgb(143, 3, 57); border-radius: 10px;">
          <h3 style="font-weight: 100; margin: 1ex 0; text-align: center;">
            <a href="https://sonarcloud.io/project/overview?id=${org}_${repo}" style="color: white;">${repo}</a>
          </h3>
          <div style="background: #595959; border-radius: 10px; overflow: clip; padding: 1ex;">
            ${cells}
          </div>
        </div>
      `;
    })
    .join("\n");
}
