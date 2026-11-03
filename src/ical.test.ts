// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

// Checks of the parts of the app that read and write iCalendar/vCard data with ical.js

import { expect, it } from "vitest";
import ICAL from "ical.js";

import { ContactType, EventType, TaskStatusType, TaskType } from "./pim-types";
import { parseDate } from "./helpers";
import { RRuleOptions, rruleToRecur } from "./widgets/RRule";

function vcalendar(...lines: string[]) {
  return ["BEGIN:VCALENDAR", "VERSION:2.0", ...lines, "END:VCALENDAR"].join("\r\n");
}

it("reads the time zone of an event and keeps it when saving", () => {
  const event = EventType.parse(vcalendar(
    "BEGIN:VEVENT",
    "UID:tz-event",
    "SUMMARY:Meeting",
    "DTSTART;TZID=Europe/Athens:20261012T100000",
    "DTEND;TZID=Europe/Athens:20261012T110000",
    "END:VEVENT"
  ));

  expect(event.timezone).toBe("Europe/Athens");
  // 10:00 in Athens is 07:00 UTC in October
  expect(event.start.toISOString()).toBe("2026-10-12T07:00:00.000Z");
  const ics = event.toIcal();
  expect(ics).toMatch(/^DTSTART;TZID=Europe\/Athens:20261012T100000\r?$/m);
  expect(ics).toMatch(/^BEGIN:VTIMEZONE\r?$/m);
});

it("saves the repeat rule the way the editor reads it", () => {
  const event = EventType.parse(vcalendar(
    "BEGIN:VEVENT",
    "UID:rrule-event",
    "DTSTART:20261012T100000Z",
    "RRULE:FREQ=MONTHLY;UNTIL=20271012T100000Z;BYDAY=MO;BYSETPOS=2",
    "END:VEVENT"
  ));

  // What EventEdit does when opening the event…
  const rrule = event.component.getFirstPropertyValue("rrule") as ICAL.Recur;
  const options = rrule.toJSON() as RRuleOptions;
  options.until = rrule.until ?? undefined;
  expect(options.freq).toBe("MONTHLY");
  expect(options.until?.toString()).toBe("2027-10-12T10:00:00Z");

  // …and when saving it, including the single values the editor sets
  event.component.updatePropertyWithValue("rrule", rruleToRecur(options));
  expect(EventType.parse(event.toIcal()).rrule.toString()).toBe("FREQ=MONTHLY;BYDAY=MO;BYSETPOS=2;UNTIL=20271012T100000Z");

  event.component.updatePropertyWithValue("rrule", rruleToRecur({ freq: "WEEKLY", interval: 2, byday: "TU", count: 3 }));
  expect(EventType.parse(event.toIcal()).rrule.toString()).toBe("FREQ=WEEKLY;COUNT=3;INTERVAL=2;BYDAY=TU");
});

it("creates the next occurrence of a repeating task", () => {
  const task = TaskType.parse(vcalendar(
    "BEGIN:VTODO",
    "UID:repeating-task",
    "SUMMARY:Water the plants",
    "STATUS:COMPLETED",
    "PRIORITY:5",
    "DTSTART:20200106T090000Z",
    "DUE:20200106T100000Z",
    "RRULE:FREQ=DAILY;COUNT=10000",
    "END:VTODO"
  ));
  expect(task.priority).toBe(5);
  expect(task.finished).toBe(true);

  const next = task.getNextOccurence()!;
  expect(next.uid).not.toBe(task.uid);
  expect(next.status).toBe(TaskStatusType.NeedsAction);
  expect(next.summary).toBe("Water the plants");
  // The next one after now, with one occurrence less to go
  const start = next.startDate.toJSDate();
  expect(start.getTime()).toBeGreaterThan(Date.now());
  expect(start.getTime() - Date.now()).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
  expect(next.rrule.count).toBe(9999);
  expect(next.lastModified).toBeDefined();

  const saved = TaskType.parse(next.toIcal());
  expect(saved.status).toBe(TaskStatusType.NeedsAction);
  expect(saved.dueDate!.toJSDate()).toEqual(next.dueDate!.toJSDate());
});

it("reads contacts, groups and birthdays", () => {
  const contact = ContactType.parse([
    "BEGIN:VCARD",
    "VERSION:4.0",
    "UID:contact-1",
    "FN:Ada Lovelace",
    "N:Lovelace;Ada;;;",
    "BDAY:18151210",
    "REV:20261012T100000Z",
    "END:VCARD",
  ].join("\r\n"));
  expect(contact.uid).toBe("contact-1");
  expect(contact.fn).toBe("Ada Lovelace");
  expect(contact.n).toEqual(["Lovelace", "Ada", "", "", ""]);
  expect(contact.group).toBe(false);
  expect(contact.lastModified?.toJSDate().toISOString()).toBe("2026-10-12T10:00:00.000Z");
  expect(parseDate(contact.comp.getFirstProperty("bday")!)).toEqual({ day: 10, month: 11, year: 1815 });

  const noYear = ContactType.parse("BEGIN:VCARD\r\nVERSION:4.0\r\nUID:contact-2\r\nFN:B\r\nBDAY:--0412\r\nEND:VCARD");
  expect(parseDate(noYear.comp.getFirstProperty("bday")!)).toEqual({ day: 12, month: 3, year: undefined });

  const group = ContactType.parse([
    "BEGIN:VCARD",
    "VERSION:4.0",
    "UID:group-1",
    "FN:Friends",
    "KIND:group",
    "MEMBER:urn:uuid:contact-1",
    "MEMBER:urn:uuid:contact-2",
    "END:VCARD",
  ].join("\r\n"));
  expect(group.group).toBe(true);
  expect(group.members).toEqual(["contact-1", "contact-2"]);
});
