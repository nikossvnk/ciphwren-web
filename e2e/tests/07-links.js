// The links to other sites on the login and signup pages and in the side menu: only to this fork's
// repository, none to EteSync's services and none to pages that don't exist
const { check, open, run } = require("../lib");

const repo = "https://github.com/nikossvnk/ciphwren-web";
const allowed = [repo, repo + "/issues"];

// The links of the page that go to another site
async function externalLinks(page) {
  return page.evaluate(() => [...document.querySelectorAll("a[href]")]
    .map((a) => a.href)
    .filter((href) => new URL(href).origin !== location.origin));
}

function checkLinks(where, links) {
  check(`${where}: no links to EteSync's sites`, !links.some((l) => /etesync\.com|etebase\.com/.test(l)), links);
  check(`${where}: only links to the repository and its issues`, links.every((l) => allowed.includes(l)), links);
}

run(async () => {
  const app = await open();
  const { page } = app;

  await page.getByRole("button", { name: "Log In" }).waitFor();
  const login = await externalLinks(page);
  checkLinks("login page", login);
  check("login page: the source code link is kept", login.includes(repo), login);
  check("login page: no forgot password link", await page.getByText("Forgot password?").count() === 0);

  await page.getByRole("link", { name: "create an account" }).click();
  await page.getByRole("heading", { name: "Signup" }).waitFor();
  checkLinks("signup page", await externalLinks(page));
  check("signup page: no free trial or pricing notice", await page.getByText(/free trial|pricing/i).count() === 0);
  check("signup page: no terms of service", await page.getByText(/terms of service/i).count() === 0);
  check("signup page: still warns that the password can't be recovered",
    await page.getByText(/remember your password/).isVisible());

  await page.getByRole("link", { name: "log in to your account" }).click();
  await app.loginToPim();
  await page.locator("header button").first().click();
  await page.getByText("External Links").waitFor();
  const menu = await externalLinks(page);
  checkLinks("side menu", menu);
  check("side menu: links to the source code and to report an issue", allowed.every((l) => menu.includes(l)), menu);
  check("side menu: no Website or FAQ items",
    await page.getByText("Website", { exact: true }).count() === 0 && await page.getByText("FAQ", { exact: true }).count() === 0);

  await app.close(check);
});
