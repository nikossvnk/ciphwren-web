import * as React from "react";

import Switch from "@mui/material/Switch";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MenuItem from "@mui/material/MenuItem";
import SortIcon from "@mui/icons-material/Sort";
import SearchIcon from "@mui/icons-material/Search";
import TextField from "@mui/material/TextField";
import { Transition } from "react-transition-group";
import InputAdornment from "@mui/material/InputAdornment";

import { PimType } from "../pim-types";

import { useSelector, useDispatch } from "react-redux";

import { setSettings } from "../store/actions";
import { StoreState } from "../store";

import Menu from "../widgets/Menu";
import { ListItemText, ListItemSecondaryAction } from "@mui/material";
import { CachedCollection } from "../Pim/helpers";

const transitionTimeout = 300;

const transitionStyles: { [key: string]: React.CSSProperties } = {
  entering: { visibility: "visible", width: "100%", overflow: "hidden" },
  entered: { visibility: "visible", width: "100%" },
  exiting: { visibility: "visible", width: "0%", overflow: "hidden" },
  exited: { visibility: "hidden", width: "0%" },
};

const textFieldSx = {
  transition: `width ${transitionTimeout}ms`,
  mr: 1,
};
const buttonStyle = { marginRight: 8 };

interface PropsType {
  defaultCollection: CachedCollection;
  onItemSave: (item: PimType, journalUid: string, originalItem?: PimType) => Promise<void>;
  showCompleted: boolean;
  showHidden: boolean;
  setShowCompleted: (completed: boolean) => void;
  setShowHidden: (hidden: boolean) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function Toolbar(props: PropsType) {
  const { showCompleted, setShowCompleted, searchTerm, setSearchTerm, showHidden, setShowHidden } = props;

  const [sortAnchorEl, setSortAnchorEl] = React.useState<null | HTMLElement>(null);
  const [optionsAnchorEl, setOptionsAnchorEl] = React.useState<null | HTMLElement>(null);

  const showSearchField = true;
  const nodeRef = React.useRef<HTMLDivElement>(null);

  const dispatch = useDispatch();
  const taskSettings = useSelector((state: StoreState) => state.settings.taskSettings);
  const { sortBy } = taskSettings;

  const handleSortChange = (sort: string) => {
    dispatch(setSettings({ taskSettings: { ...taskSettings, sortBy: sort } }));
    setSortAnchorEl(null);
  };

  const SortMenuItem = React.forwardRef<HTMLLIElement, { name: string, label: string }>(function SortMenuItem(props, ref) {
    return (
      <MenuItem ref={ref} selected={sortBy === props.name} onClick={() => handleSortChange(props.name)}>{props.label}</MenuItem>
    );
  });

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
      <Transition nodeRef={nodeRef} in={showSearchField} timeout={transitionTimeout}>
        {(state) => (
          <TextField
            ref={nodeRef}
            fullWidth
            placeholder="Search"
            value={searchTerm}
            color="secondary"
            variant="standard"
            sx={textFieldSx}
            style={transitionStyles[state]}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
            }}
          />
        )}
      </Transition>

      <div style={buttonStyle}>
        <IconButton
          size="small"
          title="Sort"
          aria-label="Sort"
          aria-controls="sort-menu"
          aria-haspopup="true"
          onClick={(e) => setSortAnchorEl(e.currentTarget)}
        >
          <SortIcon />
        </IconButton>
        <Menu
          id="sort-menu"
          anchorEl={sortAnchorEl}
          keepMounted
          open={!!sortAnchorEl}
          onClose={() => setSortAnchorEl(null)}
        >
          <SortMenuItem name="smart" label="Smart" />
          <SortMenuItem name="dueDate" label="Due Date" />
          <SortMenuItem name="priority" label="Priority" />
          <SortMenuItem name="title" label="Title" />
          <SortMenuItem name="lastModifiedDate" label="Last Modified" />
        </Menu>
      </div>

      <div style={buttonStyle}>
        <IconButton
          size="small"
          title="Options"
          aria-label="Options"
          aria-controls="options-menu"
          aria-haspopup="true"
          onClick={(e) => setOptionsAnchorEl(e.currentTarget)}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          id="options-menu"
          anchorEl={optionsAnchorEl}
          keepMounted
          open={!!optionsAnchorEl}
          onClose={() => setOptionsAnchorEl(null)}
        >
          <MenuItem>
            <ListItemText style={{ marginRight: "1.5em" }}>Show completed</ListItemText>
            <ListItemSecondaryAction>
              <Switch checked={showCompleted} onChange={(_e, checked) => setShowCompleted(checked)} edge="end" />
            </ListItemSecondaryAction>
          </MenuItem>
          <MenuItem>
            <ListItemText style={{ marginRight: "1.5em" }}>Show hidden</ListItemText>
            <ListItemSecondaryAction>
              <Switch checked={showHidden} onChange={(_e, checked) => setShowHidden(checked)} edge="end" />
            </ListItemSecondaryAction>
          </MenuItem>
        </Menu>

      </div>
    </div>
  );
}
