// SPDX-FileCopyrightText: © 2020 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { Routes, Route, Navigate } from "react-router";

import * as Etebase from "etebase";

import { useCredentials } from "../credentials";
import { routeResolver } from "../App";
import LoadingIndicator from "../widgets/LoadingIndicator";

import AppBarOverride from "../widgets/AppBarOverride";
import { List, ListItem } from "../widgets/List";
import Container from "../widgets/Container";
import { IconButton } from "@mui/material";
import IconAccept from "@mui/icons-material/Done";
import IconReject from "@mui/icons-material/Close";
import ConfirmationDialog from "../widgets/ConfirmationDialog";
import PrettyFingerprint from "../widgets/PrettyFingerprint";

async function loadInvitations(etebase: Etebase.Account) {
  const ret: Etebase.SignedInvitation[] = [];
  const invitationManager = etebase.getInvitationManager();

  let iterator: string | null = null;
  let done = false;
  while (!done) {
    const invitations = await invitationManager.listIncoming({ iterator, limit: 30 });
    iterator = invitations.iterator as string;
    done = invitations.done;

    ret.push(...invitations.data);
  }

  return ret;
}

export default function Invitations() {
  return (
    <Routes>
      <Route
        index
        element={<Navigate to={routeResolver.getRoute("collections.invitations.incoming")} replace />}
      />
      <Route
        path={routeResolver.getRelativeRoute("collections.invitations.incoming", "collections.invitations")}
        element={
          <InvitationsIncoming
          />
        }
      />
    </Routes>
  );
}

function InvitationsIncoming() {
  const [invitations, setInvitations] = React.useState<Etebase.SignedInvitation[]>();
  const [chosenInvitation, setChosenInvitation] = React.useState<Etebase.SignedInvitation>();
  const etebase = useCredentials()!;

  React.useEffect(() => {
    loadInvitations(etebase).then(setInvitations);
  }, [etebase]);

  function removeInvitation(invite: Etebase.SignedInvitation) {
    setInvitations(invitations?.filter((x) => x.uid !== invite.uid));
  }

  async function reject(invite: Etebase.SignedInvitation) {
    const invitationManager = etebase.getInvitationManager();
    await invitationManager.reject(invite);
    removeInvitation(invite);
  }

  async function accept(invite: Etebase.SignedInvitation) {
    const invitationManager = etebase.getInvitationManager();
    await invitationManager.accept(invite);
    setChosenInvitation(undefined);
    removeInvitation(invite);
  }

  return (
    <>
      <AppBarOverride title="Incoming Invitations" />
      <Container style={{ maxWidth: "30rem" }}>
        {invitations ?
          <List>
            {(invitations.length > 0 ?
              invitations.map((invite) => (
                <ListItem
                  key={invite.uid}
                  rightIcon={(
                    <>
                      <IconButton title="Reject" onClick={() => reject(invite)}>
                        <IconReject color="error" />
                      </IconButton>
                      <IconButton title="Accept" onClick={() => setChosenInvitation(invite)}>
                        <IconAccept color="secondary" />
                      </IconButton>
                    </>
                  )}
                >
                  Invitation from {invite.fromUsername}
                </ListItem>
              ))
              :
              <ListItem>
                No invitations
              </ListItem>
            )}
          </List>
          :
          <LoadingIndicator />
        }
      </Container>
      {chosenInvitation && (
        <ConfirmationDialog
          title="Accept invitation"
          labelOk="OK"
          open={!!chosenInvitation}
          onOk={() => accept(chosenInvitation)}
          onCancel={() => setChosenInvitation(undefined)}
        >
          Please verify the inviter's security fingerprint to ensure the invitation is secure:
          <div style={{ textAlign: "center" }}>
            <PrettyFingerprint publicKey={chosenInvitation.fromPubkey} />
          </div>
        </ConfirmationDialog>
      )}
    </>
  );
}
