function ContextMenu({ onOpenEasterEggs }) {
  return (
    <div className="context-menu-container">
      <div>Izak Bunda's Portfolio</div>
      <hr style={{ margin: "4px 0", borderColor: "#ccc" }} />
      <div className="context-menu-item" onClick={onOpenEasterEggs}>
        Easter Eggs
      </div>
    </div>
  );
}

export default ContextMenu;
