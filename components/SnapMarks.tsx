/**
 * Extra snap anchors inside a pinned section.
 *
 * A section's whole choreography in a single gesture would be a blur, and it
 * would make the gestures wildly uneven — one screen to leave the hero, then
 * nine to cross the Art Station. These mark the section's own act boundaries
 * so each gesture covers a comparable distance and always lands on a beat
 * that has finished playing.
 *
 * `at` is in svh, measured from the top of the section, and lines up with the
 * phase budgets directly: a pinned section is `TOTAL + 100` svh tall and its
 * progress runs over `TOTAL`, so a boundary at N svh of budget sits exactly
 * N svh below the section's top.
 */
export default function SnapMarks({ at }: { at: number[] }) {
  return (
    <>
      {at.map((svh) => (
        <div
          key={svh}
          data-snap
          aria-hidden="true"
          className="pointer-events-none absolute left-0 h-px w-px"
          style={{ top: `${svh}svh` }}
        />
      ))}
    </>
  );
}
