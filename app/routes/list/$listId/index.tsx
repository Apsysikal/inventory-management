import { json, LoaderArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { prisma } from "~/utilities/prisma.server";
import { requireUser } from "~/utilities/session.server";

export async function loader({ request, params }: LoaderArgs) {
  const listId = params.listId;
  invariant(listId, "Expected listId to be defined.");

  const user = await requireUser(request);

  // Find a match for the requested list with the currently
  // signed in user. If no match is found, the user isn't
  // part of members and for that not allowed to access this
  // list.
  const members = await prisma.membersOfItemList.findFirst({
    where: {
      userId: user.id,
      itemListId: listId,
    },
  });

  if (!members) {
    throw new Response(`Sorry, you're not allowed to acces this list`, {
      status: 403,
      statusText: "Forbidden",
    });
  }

  const list = await prisma.itemList.findUnique({
    where: { id: listId },
    include: { Items: true },
  });

  if (!list) {
    throw new Response(`Couldn't find a list with id '${listId}'`, {
      status: 404,
      statusText: "Not Found",
    });
  }

  return json({
    list,
  });
}

export default function ListIndexRoute() {
  const { list } = useLoaderData<typeof loader>();

  return (
    <>
      <h1>{list.description}</h1>
      <div>
        <Link to="checkin">Checkin</Link>
        <Link to="checkout">Checkout</Link>
        <Link to="new">New Item</Link>
      </div>
      <ul>
        {list.Items.map((item) => {
          return (
            <li key={item.id}>
              <p>
                <span>
                  {item.serial} {item.description}
                </span>{" "}
                <span>{item.count}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </>
  );
}
