// Tasks: quick adding, adding with details, completing, searching and deleting tasks
const { api, check, day, icalDay, itemsWith, open, run, unique } = require("../lib");

run(async () => {
  const app = await open();
  const { page } = app;
  await app.loginToPim();
  await page.getByRole("tab", { name: "Tasks" }).click();
  await page.waitForURL(/\/pim\/tasks$/);
  const id = unique();

  // Quick add
  const quickAdd = page.locator("form", { hasText: "Add a new task" }).locator("input");
  const quick = `Buy milk ${id}`;
  await quickAdd.fill(quick);
  await quickAdd.press("Enter");
  await page.getByText(quick).waitFor({ timeout: 10000 }).catch(() => undefined);
  check("the quickly added task is in the list", await page.getByText(quick).isVisible());
  await app.synced();
  let saved = await itemsWith("etebase.vtodo", `SUMMARY:${quick}`);
  check("the quickly added task is on the server", saved.length === 1, saved);
  check("as a task that needs action", /BEGIN:VTODO[\s\S]*STATUS:NEEDS-ACTION/.test(saved[0] || ""), saved[0]);

  // A task with details
  const title = `File the taxes ${id}`;
  await page.locator("button[class*=Fab]").click();
  await page.waitForURL(/\/tasks\/new/);
  await page.locator("input[name=title]").fill(title);
  await page.getByLabel("High").check();
  // The date fields: hide until, and due
  await app.typeDate(app.dateFields().nth(1), day(5));
  await page.locator("textarea[name=description]").fill("Before the deadline");
  await page.getByRole("textbox", { name: "Tags" }).fill("home");
  await page.getByRole("textbox", { name: "Tags" }).press("Enter");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL(/\/pim\/tasks$/);
  await app.synced();
  saved = await itemsWith("etebase.vtodo", `SUMMARY:${title}`);
  check("the task is on the server", saved.length === 1, saved.length);
  const ics = saved[0] || "";
  check("with its priority", /^PRIORITY:1\r?$/m.test(ics), ics);
  check("with its due date", new RegExp(`^DUE;VALUE=DATE:${icalDay(5)}\\r?$`, "m").test(ics), ics);
  check("with its description", ics.includes("DESCRIPTION:Before the deadline"), ics);
  check("with its tag", /^CATEGORIES:home\r?$/m.test(ics), ics);
  check("the task is in the list", await page.getByText(title).isVisible());

  // Searching
  await page.getByPlaceholder("Search").fill("taxes");
  await page.waitForTimeout(300);
  check("searching finds the task", await page.getByText(title).isVisible());
  check("and not the other one", !(await page.getByText(quick).isVisible()));
  await page.getByPlaceholder("Search").fill("");

  // Completing the quick one
  await page.getByText(quick).locator("xpath=ancestor::*[.//input[@type='checkbox']][1]").locator("input[type=checkbox]").click();
  await app.synced();
  await page.waitForTimeout(500);
  saved = await itemsWith("etebase.vtodo", `SUMMARY:${quick}`);
  check("the completed task is completed on the server", /^STATUS:COMPLETED\r?$/m.test(saved[0] || ""), saved[0]);
  check("and isn't in the list anymore", !(await page.getByText(quick).isVisible()));

  // The task page, and deleting from there
  await page.getByText(title).click();
  await page.waitForURL(/\/pim\/tasks\/[^/]+$/);
  const shown = await page.innerText("body");
  check("the task page shows the title", shown.includes(title), shown);
  check("the task page shows the description", shown.includes("Before the deadline"), shown);
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await page.waitForURL(/\/pim\/tasks$/);
  await app.synced();
  saved = await itemsWith("etebase.vtodo", `SUMMARY:${title}`);
  check("the deleted task is gone from the server", saved.length === 0, saved);
  check("and from the list", !(await page.getByText(title).isVisible()));

  // Completing a repeating task (in its editor) adds its next occurrence, as long as the task was
  // (Times in a time zone, the way the app saves them)
  const repeating = `Water the plants ${id}`;
  await api.addItem("etebase.vtodo", [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//e2e//EN", "BEGIN:VTODO", `UID:e2e-${unique()}`,
    `SUMMARY:${repeating}`, "STATUS:NEEDS-ACTION", `DTSTART;TZID=Europe/Berlin:${icalDay(-3)}T090000`,
    `DUE;TZID=Europe/Berlin:${icalDay(-3)}T100000`,
    "RRULE:FREQ=DAILY;COUNT=100", "END:VTODO", "END:VCALENDAR", "",
  ].join("\r\n"));
  await app.sync();
  await page.getByText(repeating).click();
  await page.waitForURL(/\/pim\/tasks\/[^/]+$/);
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Needs action" }).click();
  await page.getByRole("option", { name: "Completed" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  // Back to the task's page
  await page.waitForURL(/\/pim\/tasks\/[^/]+$/);
  await app.synced();
  saved = await itemsWith("etebase.vtodo", `SUMMARY:${repeating}`);
  check("the repeating task is completed on the server", saved.some((x) => /^STATUS:COMPLETED\r?$/m.test(x)), saved);
  const next = saved.find((x) => /^STATUS:NEEDS-ACTION\r?$/m.test(x)) || "";
  check("and its next occurrence is on the server", saved.length === 2 && next !== "", saved);
  const start = /^DTSTART;TZID=Europe\/Berlin:(\d{8})T(\d{6})\r?$/m.exec(next);
  const due = /^DUE;TZID=Europe\/Berlin:(\d{8})T(\d{6})\r?$/m.exec(next);
  check("starting at the same time of a later day", !!start && start[2] === "090000" && start[1] > icalDay(-3), next);
  check("and still an hour long", !!start && !!due && due[1] === start[1] && due[2] === "100000", next);
  check("with one occurrence less to go", /^RRULE:FREQ=DAILY;COUNT=99\r?$/m.test(next), next);

  // Completing a repeating task in the list adds its next occurrence too
  const listed = `Take out the bins ${id}`;
  await api.addItem("etebase.vtodo", [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//e2e//EN", "BEGIN:VTODO", `UID:e2e-${unique()}`,
    `SUMMARY:${listed}`, "STATUS:NEEDS-ACTION", `DUE;TZID=Europe/Berlin:${icalDay(-2)}T200000`,
    "RRULE:FREQ=WEEKLY;COUNT=10", "END:VTODO", "END:VCALENDAR", "",
  ].join("\r\n"));
  await page.getByRole("tab", { name: "Tasks" }).click();
  await page.waitForURL(/\/pim\/tasks$/);
  await app.sync();
  await page.getByText(listed).locator("xpath=ancestor::*[.//input[@type='checkbox']][1]").locator("input[type=checkbox]").click();
  await app.synced();
  await page.waitForTimeout(500);
  saved = await itemsWith("etebase.vtodo", `SUMMARY:${listed}`);
  check("the task completed in the list is completed on the server", saved.some((x) => /^STATUS:COMPLETED\r?$/m.test(x)), saved);
  const nextListed = saved.find((x) => /^STATUS:NEEDS-ACTION\r?$/m.test(x)) || "";
  check("and its next occurrence is on the server", saved.length === 2 && nextListed !== "", saved);
  check("due a week later", new RegExp(`^DUE;TZID=Europe/Berlin:${icalDay(5)}T200000\\r?$`, "m").test(nextListed), nextListed);
  check("with one occurrence less to go", /^RRULE:FREQ=WEEKLY;COUNT=9\r?$/m.test(nextListed), nextListed);
  // (Exactly the title: the message that it was rescheduled has it too)
  const listItem = page.getByText(listed, { exact: true });
  check("and it's in the list, not completed", (await listItem.count()) === 1 &&
    !(await listItem.locator("xpath=ancestor::*[.//input[@type='checkbox']][1]").locator("input[type=checkbox]").isChecked()));

  // A task with its times in UTC keeps them when edited
  const utc = `Call the bank ${id}`;
  await api.addItem("etebase.vtodo", [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//e2e//EN", "BEGIN:VTODO", `UID:e2e-${unique()}`,
    `SUMMARY:${utc}`, "STATUS:NEEDS-ACTION", `DTSTART:${icalDay(-1)}T080000Z`, `DUE:${icalDay(2)}T150000Z`,
    "END:VTODO", "END:VCALENDAR", "",
  ].join("\r\n"));
  await app.sync();
  await page.getByText(utc, { exact: true }).click();
  await page.waitForURL(/\/pim\/tasks\/[^/]+$/);
  await page.getByRole("button", { name: "Edit" }).click();
  await page.waitForURL(/\/edit$/);
  await page.locator("input[name=title]").fill(`${utc} (renamed)`);
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL((url) => !url.pathname.endsWith("/edit"));
  await app.synced();
  saved = await itemsWith("etebase.vtodo", utc);
  check("the renamed task is on the server", saved.length === 1 && saved[0].includes(`SUMMARY:${utc} (renamed)`), saved);
  check("still starting at 08:00 UTC", new RegExp(`^DTSTART:${icalDay(-1)}T080000Z\\r?$`, "m").test(saved[0] || ""), saved[0]);
  check("and due at 15:00 UTC", new RegExp(`^DUE:${icalDay(2)}T150000Z\\r?$`, "m").test(saved[0] || ""), saved[0]);

  check("no sync errors", (await app.syncErrors()) === "", await app.syncErrors());
  await app.close(check);
});
