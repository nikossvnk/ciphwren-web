import * as React from "react";

import InboxIcon from "@mui/icons-material/Inbox";
import LabelIcon from "@mui/icons-material/LabelOutlined";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/EditOutlined";

import IconButton from "@mui/material/IconButton";

import { List, ListItem, ListSubheader } from "../widgets/List";
import { ContactType } from "../pim-types";

interface ListItemPropsType {
  name: string | undefined;
  icon?: React.ReactElement;
  primaryText: string;
  filterByGroup: string | undefined;
  setFilterByGroup: (group: string | undefined) => void;
  editGroup: () => void;
}

function SidebarListItem(props: ListItemPropsType) {
  const { name, icon, primaryText, filterByGroup, editGroup } = props;

  const handleClick = () => props.setFilterByGroup(name);

  const selected = name === filterByGroup;

  return (
    <ListItem
      onClick={handleClick}
      selected={selected}
      leftIcon={icon}
      primaryText={primaryText}
      secondaryAction={name && selected &&
        <IconButton onClick={editGroup}>
          <EditIcon />
        </IconButton>
      }
    />
  );
}

interface PropsType {
  groups: ContactType[];
  filterByGroup: string | undefined;
  setFilterByGroup: (group: string | undefined) => void;
  newGroup: () => void;
  editGroup: (group: ContactType) => void;
}

export default React.memo(function Sidebar(props: PropsType) {
  const { groups, filterByGroup, setFilterByGroup, newGroup, editGroup } = props;

  const groupList = [...groups].sort((a, b) => a.fn.localeCompare(b.fn)).map((group) => (
    <SidebarListItem
      key={group.uid}
      name={group.uid}
      primaryText={group.fn}
      icon={<LabelIcon />}
      filterByGroup={filterByGroup}
      setFilterByGroup={setFilterByGroup}
      editGroup={() => editGroup(group)}
    />
  ));

  return (
    <List dense>
      <SidebarListItem
        name={undefined}
        primaryText="All"
        icon={<InboxIcon />}
        filterByGroup={filterByGroup}
        setFilterByGroup={setFilterByGroup}
        editGroup={newGroup}
      />

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <ListSubheader>
          Groups
        </ListSubheader>
        <IconButton
          edge="end"
          onClick={newGroup}
        >
          <AddIcon />
        </IconButton>
      </div>

      {groupList}
    </List>
  );
});
