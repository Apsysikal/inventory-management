import { json, LoaderArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { prisma } from "~/utilities/prisma.server";
import { requireUser } from "~/utilities/session.server";

export async function loader({ request }: LoaderArgs) {
  const user = await requireUser(request);
  const lists = await prisma.membersOfItemList.findMany({
    where: { userId: user.id },
    select: { itemListId: true, itemList: true },
  });

  if (!lists) {
    throw new Response(`Couldn't find any lists for '${user.username}'`, {
      status: 404,
      statusText: "Not Found",
    });
  }

  return json({
    lists,
  });
}

/**
 * Renders the layout route for the "/list"
 * route in the app.
 */
export default function ListLayoutRoute() {
  const { lists } = useLoaderData<typeof loader>();

  return (
    <>
      <div>
        <ul>
          {lists.map((list) => {
            return (
              <li key={list.itemListId}>
                <Link to={list.itemListId}>{list.itemList.description}</Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <Outlet />
      </div>
    </>
  );
}
