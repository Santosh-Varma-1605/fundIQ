export async function intakeNode(state) {
  return {
    ...state,
    round: 1,
    status: "running",
  };
}