export interface RevisionState {
  draftStarted: boolean;
  pageChanged: boolean;
  backgrounded: boolean;
  returnedFromBackground: boolean;
}

export type Visibility = "hidden" | "visible";

export function createRevisionState(): RevisionState {
  return {
    draftStarted: false,
    pageChanged: false,
    backgrounded: false,
    returnedFromBackground: false,
  };
}

export function markDraftStarted(state: RevisionState): RevisionState {
  return { ...state, draftStarted: true };
}

export function markMutation(
  state: RevisionState,
  details: { insideComposer: boolean },
): RevisionState {
  if (details.insideComposer) {
    return state;
  }

  return { ...state, pageChanged: true };
}

export function markVisibility(
  state: RevisionState,
  visibility: Visibility,
): RevisionState {
  if (visibility === "hidden") {
    return { ...state, backgrounded: true };
  }

  if (state.backgrounded) {
    return { ...state, returnedFromBackground: true };
  }

  return state;
}

export function shouldPauseSend(state: RevisionState): boolean {
  return (
    state.draftStarted && (state.pageChanged || state.returnedFromBackground)
  );
}
