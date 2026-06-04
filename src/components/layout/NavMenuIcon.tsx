/** Editorial three-line menu mark — matches stamp / dashed nav aesthetic */
export default function NavMenuIcon({ open }: { open: boolean }) {
  return (
    <span className={`nav-menu-icon${open ? ' open' : ''}`} aria-hidden>
      <span className="nav-menu-icon-bar" />
      <span className="nav-menu-icon-bar" />
      <span className="nav-menu-icon-bar" />
    </span>
  )
}
