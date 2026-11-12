import * as React from "react";
import SearchIcon from "@mui/icons-material/Search";
import TextField from "@mui/material/TextField";
import { Transition } from "react-transition-group";
import InputAdornment from "@mui/material/InputAdornment";

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

interface PropsType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function Toolbar(props: PropsType) {
  const { searchTerm, setSearchTerm } = props;

  const showSearchField = true;
  const nodeRef = React.useRef<HTMLDivElement>(null);

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
    </div>
  );
}
