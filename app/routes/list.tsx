import { Outlet } from "@remix-run/react";

/**
 * Renders the layout route for the "/list"
 * route in the app.
 */
export default function ListLayoutRoute() {
  return (
    <>
      <Outlet />
    </>
  );
}
