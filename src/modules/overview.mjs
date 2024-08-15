const sonarBadges = (project, token) =>
  [
    ["coverage", "Code coverage percentage"],
    ["code_smells", "Code that could likely be improved"],
    ["alert_status", "Quality gate status"],
    ["bugs", "Bugs/reliability - count; based on Clean Code principals"],
    ["reliability_rating", "Bugs/reliability - grade; based on the makeup of: types, count, and project size"],
    ["vulnerabilities", "Security/vulnerability - count; based on Clean Code principals"],
    ["security_rating", "Security/vulnerability - grade; based on the makeup of: types, count, and project size"],
    ["sqale_index", "Maintainability/tech-debt - count; based on Clean Code principals"],
    ["sqale_rating", "Maintainability/tech-debt - grade; based on the makeup of: types, count, and project size"],
    ["ncloc", "Number of lines of code"],
  ].reduce((acc, [metric, title]) => {
    return (
      acc +
      `<figure style="margin: 0; padding: 2px 0;">
      <img
        alt="${title}"
        src="https://sonarcloud.io/api/project_badges/measure?project=${project}&metric=${metric}&token=${token}"
        title="${title}"
      />
    </figure>`
    );
  }, "");

export function displayOverview(config) {
  const { repos } = config;

  const panel = inDOM("#projects-overview");

  panel.setAttribute("open", true);
  panel.style.visibility = "visible";

  inDOM("#overview-badges").innerHTML = Object.entries(repos).reduce(
    (acc, [repo, { sonar }]) =>
      acc +
      sonar.reduce(
        (acc, { label = repo ?? project, project, token }) =>
          acc +
          `
              <div style="background: rgb(143, 3, 57); border-radius: 10px;">
                <h3 style="font-weight: 100; margin: 1ex 0; text-align: center;">
                  <a href="https://sonarcloud.io/project/overview?id=${project}" style="color: white;">${label}</a>
                </h3>
                <div style="background: #595959; border-radius: 10px; overflow: clip; padding: 1ex;">
                  ${sonarBadges(project, token)}
                </div>
              </div>
            `,
        ""
      ),
    ""
  );
}
