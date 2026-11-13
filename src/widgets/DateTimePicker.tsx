// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTimePicker as MuiDateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { PickersActionBarAction } from "@mui/x-date-pickers/PickersActionBar";

import moment from "moment";

interface PropsType {
  placeholder: string;
  value?: Date;
  dateOnly?: boolean;
  onChange: (date?: Date) => void;
}

const actions: PickersActionBarAction[] = ["today", "cancel", "accept"];

export default function DateTimePicker(props: PropsType) {
  const { value, dateOnly, onChange } = props;
  // What the field has, which is invalid while a date is being typed (and unset for the parent)
  const [current, setCurrent] = React.useState<moment.Moment | null>(null);
  let shown: moment.Moment | null;
  if (value) {
    shown = (current?.isValid() && (current.valueOf() === value.getTime())) ? current : moment(value);
  } else {
    // Giving the field back null would clear what it has so far
    shown = (current && !current.isValid()) ? current : null;
  }
  // The locale's date format (moment.locale() is set from the settings), with a 24-hour time
  const dayFormat = moment.localeData().longDateFormat("L");
  const pickerProps = {
    value: shown,
    onChange: (date: moment.Moment | null) => {
      setCurrent(date);
      onChange(date?.isValid() ? date.toDate() : undefined);
    },
    slotProps: {
      textField: { variant: "standard" as const },
      actionBar: { actions },
    },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale={moment.locale()}>
      {dateOnly ? (
        <DatePicker format={dayFormat} {...pickerProps} />
      ) : (
        <MuiDateTimePicker format={`${dayFormat} HH:mm`} ampm={false} {...pickerProps} />
      )}
    </LocalizationProvider>
  );
}
