export async function roundCheckNode(state) {
  return { ...state, round: state.round + 1 };
}

export function roundCheckRouter(state) {
  return state.round <= state.maxRounds ? "continue" : "done";
}