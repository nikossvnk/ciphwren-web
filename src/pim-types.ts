// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import ICAL from "ical.js";
import * as zones from "./data/zones.json";
import moment from "moment";
import * as uuid from "uuid";

export const PRODID = "-//iCal.js EteSync iOS";

export interface PimType {
  uid: string;
  collectionUid?: string;
  itemUid?: string;
  toIcal(): string;
  clone(): PimType;
  lastModified: ICAL.Time | undefined;
}

export function timezoneLoadFromName(timezone: string | null): ICAL.Timezone | null {
  if (!timezone) {
    return null;
  }

  const allZones: { [key: string]: { ics: string[] } } = zones.zones;
  const aliases: { [key: string]: { aliasTo: string } } = zones.aliases;
  // UTC (and its aliases, like "Z") isn't in the list of zones, ical.js has it
  if ((timezone === "UTC") || (aliases[timezone]?.aliasTo === "UTC")) {
    return ICAL.Timezone.utcTimezone;
  }
  let zone = allZones[timezone];
  if (!zone && aliases[timezone]) {
    zone = allZones[aliases[timezone].aliasTo];
  }

  if (!zone) {
    return null;
  }

  if (ICAL.TimezoneService.has(timezone)) {
    return ICAL.TimezoneService.get(timezone);
  }

  const component = new ICAL.Component("vtimezone");
  zone.ics.forEach((zonePart: string) => {
    component.addSubcomponent(new ICAL.Component(ICAL.parse(zonePart)));
  });
  component.addPropertyWithValue("tzid", timezone);

  const retZone = new ICAL.Timezone({
    component,
    tzid: timezone,
  });

  ICAL.TimezoneService.register(retZone, timezone);

  return retZone;
}

// The name of the time zone of a time: its TZID, "Z" for UTC (as ical.js 1 had it), or null if floating
function timezoneOf(time: ICAL.Time): string | null {
  // `timezone` (the TZID the time was parsed with) is set by ical.js but missing from its type declarations
  const tzid = (time as ICAL.Time & { timezone?: string }).timezone;
  if (tzid) {
    return tzid;
  }
  return (time.zone === ICAL.Timezone.utcTimezone) ? "Z" : null;
}

export function parseString(content: string) {
  content = content.replace(/^[a-zA-Z0-9]*\./gm, ""); // FIXME: ugly hack to ignore item groups.
  return new ICAL.Component(ICAL.parse(content));
}

export class EventType extends ICAL.Event implements PimType {
  public collectionUid?: string;
  public itemUid?: string;
  // The color of the collection the event is in, which it's shown with. It's not a part of the event
  // itself, so this replaces the accessor of ical.js, which sets the COLOR property of the event.
  private _color?: string;

  // @ts-expect-error ical.js declares color as always a string, but this one can be unset
  get color(): string | undefined {
    return this._color;
  }

  // @ts-expect-error see the getter
  set color(value: string | undefined) {
    this._color = value;
  }

  public static isEvent(comp: ICAL.Component) {
    return !!comp.getFirstSubcomponent("vevent");
  }

  public static fromVCalendar(comp: ICAL.Component) {
    const event = new EventType(comp.getFirstSubcomponent("vevent") ?? undefined);
    // FIXME: we need to clone it so it loads the correct timezone and applies it
    timezoneLoadFromName(event.timezone);
    return event.clone();
  }

  public static parse(content: string) {
    return EventType.fromVCalendar(parseString(content));
  }

  get timezone(): string | null {
    if (this.startDate) {
      return timezoneOf(this.startDate);
    } else if (this.endDate) {
      return timezoneOf(this.endDate);
    }

    return null;
  }

  get title() {
    return this.summary;
  }

  set title(title: string) {
    this.summary = title;
  }

  get start() {
    return this.startDate.toJSDate();
  }

  get end() {
    return this.endDate.toJSDate();
  }

  get allDay() {
    return this.startDate.isDate;
  }

  get desc() {
    return this.description;
  }

  get lastModified() {
    return (this.component.getFirstPropertyValue("last-modified") ?? undefined) as ICAL.Time | undefined;
  }

  set lastModified(time: ICAL.Time | undefined) {
    this.component.updatePropertyWithValue("last-modified", time);
  }

  get rrule() {
    return this.component.getFirstPropertyValue("rrule") as ICAL.Recur;
  }

  set rrule(rule: ICAL.Recur) {
    this.component.updatePropertyWithValue("rrule", rule);
  }

  public toIcal() {
    const comp = new ICAL.Component(["vcalendar", [], []]);
    comp.updatePropertyWithValue("prodid", PRODID);
    comp.updatePropertyWithValue("version", "2.0");

    comp.addSubcomponent(this.component);
    ICAL.helpers.updateTimezones(comp);
    return comp.toString();
  }

  public clone() {
    const ret = new EventType(ICAL.Component.fromString(this.component.toString()));
    ret.color = this.color;
    ret.collectionUid = this.collectionUid;
    ret.itemUid = this.itemUid;
    return ret;
  }
}

export enum TaskStatusType {
  NeedsAction = "NEEDS-ACTION",
  Completed = "COMPLETED",
  InProcess = "IN-PROCESS",
  Cancelled = "CANCELLED",
}

export enum TaskPriorityType {
  Undefined = 0,
  High = 1,
  Medium = 5,
  Low = 9,
}

export let TaskTags = ["Work", "Home"];

export function setTaskTags(tags: string[]) {
  TaskTags = tags;
}

export class TaskType extends EventType {
  public collectionUid?: string;
  public itemUid?: string;

  public static fromVCalendar(comp: ICAL.Component) {
    const task = new TaskType(comp.getFirstSubcomponent("vtodo"));
    // FIXME: we need to clone it so it loads the correct timezone and applies it
    timezoneLoadFromName(task.timezone);
    return task.clone();
  }

  public static parse(content: string) {
    return TaskType.fromVCalendar(parseString(content));
  }

  constructor(comp?: ICAL.Component | null) {
    super(comp ? comp : new ICAL.Component("vtodo"));
  }

  get finished() {
    return this.status === TaskStatusType.Completed ||
      this.status === TaskStatusType.Cancelled;
  }

  set status(status: TaskStatusType) {
    this.component.updatePropertyWithValue("status", status);
  }

  get status(): TaskStatusType {
    return this.component.getFirstPropertyValue("status") as TaskStatusType;
  }

  set priority(priority: TaskPriorityType) {
    this.component.updatePropertyWithValue("priority", priority);
  }

  get priority() {
    return this.component.getFirstPropertyValue("priority") as unknown as TaskPriorityType;
  }

  set tags(tags: string[]) {
    const property = this.component.getFirstProperty("categories");
    const empty = tags.length === 0;
    if (property) {
      if (empty) {
        this.component.removeAllProperties("categories");
      } else {
        property.setValues(tags);
      }
    } else if (!empty) {
      const newProp = new ICAL.Property("categories", this.component);
      newProp.setValues(tags);
      this.component.addProperty(newProp);
    }
  }

  get tags() {
    return this.component.getFirstProperty("categories")?.getValues()?.filter((x) => x !== "") ?? [];
  }

  set dueDate(date: ICAL.Time | undefined) {
    if (date) {
      this.component.updatePropertyWithValue("due", date);
    } else {
      this.component.removeAllProperties("due");
    }
  }

  get dueDate() {
    return (this.component.getFirstPropertyValue("due") ?? undefined) as ICAL.Time | undefined;
  }

  set completionDate(date: ICAL.Time | undefined) {
    if (date) {
      this.component.updatePropertyWithValue("completed", date);
    } else {
      this.component.removeAllProperties("completed");
    }
  }

  get completionDate() {
    return (this.component.getFirstPropertyValue("completed") ?? undefined) as ICAL.Time | undefined;
  }

  set relatedTo(parentUid: string | undefined) {
    if (parentUid !== undefined) {
      this.component.updatePropertyWithValue("related-to", parentUid);
    } else {
      this.component.removeAllProperties("related-to");
    }
  }

  get relatedTo(): string | undefined {
    return (this.component.getFirstPropertyValue("related-to") ?? undefined) as string | undefined;
  }

  get endDate() {
    // XXX: A hack to override this as it shouldn't be used
    return undefined as any;
  }

  get allDay() {
    return !!((this.startDate?.isDate) || (this.dueDate?.isDate));
  }

  get dueToday() {
    return this.dueDate && moment(this.dueDate.toJSDate()).isSameOrBefore(moment(), "day");
  }

  get overdue() {
    if (!this.dueDate) {
      return false;
    }

    const dueDate = moment(this.dueDate.toJSDate());
    const now = moment();
    return (this.dueDate.isDate) ? dueDate.isBefore(now, "day") : dueDate.isBefore(now);
  }

  get hidden() {
    if (!this.startDate) {
      return false;
    }

    const startDate = moment(this.startDate.toJSDate());
    const now = moment();
    return startDate.isAfter(now);
  }

  public clone() {
    const ret = new TaskType(ICAL.Component.fromString(this.component.toString()));
    ret.color = this.color;
    return ret;
  }

  public getNextOccurence(): TaskType | null {
    if (!this.isRecurring()) {
      return null;
    }

    const rrule = this.rrule.clone();

    if (rrule.count && rrule.count <= 1) {
      return null; // end of reccurence
    }

    rrule.count = null; // clear count so we can iterate as many times as needed
    const recur = rrule.iterator(this.startDate ?? this.dueDate);
    let nextRecurrence = recur.next();
    while ((nextRecurrence = recur.next())) {
      if (nextRecurrence.compare(ICAL.Time.now()) > 0) {
        break;
      }
    }

    if (!nextRecurrence) {
      return null; // end of reccurence
    }

    const nextStartDate = this.startDate ? nextRecurrence : undefined;
    // A copy, so moving the due date by the task's length doesn't move the start too
    const nextDueDate = this.dueDate ? nextRecurrence.clone() : undefined;
    if (nextStartDate && nextDueDate) {
      const offset = this.dueDate!.subtractDateTz(this.startDate);
      nextDueDate.addDuration(offset);
    }

    const nextTask = this.clone();
    nextTask.uid = uuid.v4();
    if (nextStartDate) {
      nextTask.startDate = nextStartDate;
    }
    if (nextDueDate) {
      nextTask.dueDate = nextDueDate;
    }

    if (this.rrule.count) {
      rrule.count = this.rrule.count - 1;
      nextTask.rrule = rrule;
    }

    nextTask.status = TaskStatusType.NeedsAction;
    nextTask.lastModified = ICAL.Time.now();

    return nextTask;
  }
}

export class ContactType implements PimType {
  public comp: ICAL.Component;
  public collectionUid?: string;
  public itemUid?: string;


  public static parse(content: string) {
    return new ContactType(parseString(content));
  }

  constructor(comp: ICAL.Component) {
    this.comp = comp;
  }

  public toIcal() {
    return this.comp.toString();
  }

  public clone() {
    return new ContactType(ICAL.Component.fromString(this.comp.toString()));
  }

  get uid() {
    return this.comp.getFirstPropertyValue("uid") as string;
  }

  set uid(uid: string) {
    this.comp.updatePropertyWithValue("uid", uid);
  }

  get fn() {
    return this.comp.getFirstPropertyValue("fn") as string;
  }

  get n() {
    return this.comp.getFirstPropertyValue("n") as string[] | null;
  }

  get bday() {
    return this.comp.getFirstPropertyValue("bday") as ICAL.VCardTime | null;
  }

  get lastModified() {
    return (this.comp.getFirstPropertyValue("rev") ?? undefined) as ICAL.Time | undefined;
  }

  get group() {
    const kind = this.comp.getFirstPropertyValue("kind") as string | null;
    return !!kind && ["group", "organization"].includes(kind);
  }

  get members() {
    return this.comp.getAllProperties("member").map((prop) => (prop.getFirstValue() as string).replace("urn:uuid:", ""));
  }
}
