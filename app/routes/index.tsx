import { Link, Outlet } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/node";

export async function loader(args: LoaderArgs) {}

export default function IndexRoute() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <nav>
        <h1>Inventory Management</h1>
        <ul>
          <li>
            <Link to="/list">Inventory Lists</Link>
          </li>
          <li>
            <Link to="/login">Login</Link>
          </li>
        </ul>
      </nav>
      <Outlet />
    </div>
  );
}
