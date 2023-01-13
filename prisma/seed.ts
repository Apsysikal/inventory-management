import { PrismaClient } from "@prisma/client";
import { hash, genSalt } from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  const users = await Promise.all(
    getUsers().map(async ({ username, password }) => {
      const salt = await genSalt();

      return prisma.user.create({
        data: {
          username,
          password: {
            create: {
              hash: await hash(password, salt),
              salt,
            },
          },
        },
      });
    })
  );

  const itemLists = await Promise.all(
    getItemsList().map(({ description }) => {
      return prisma.itemList.create({
        data: {
          description,
          ownerId: users[0].id,
        },
      });
    })
  );

  // For each ItemList, create Items
  await Promise.all(
    itemLists.map(({ id: listId }) => {
      return Promise.all(
        getItems().map(({ serial, description, count }) => {
          return prisma.item.create({
            data: {
              serial,
              description,
              count,
              listId,
            },
          });
        })
      );
    })
  );

  // For each ItemList, create the UsersOfItemList
  // relation table. John is always owner, Jane
  // always just a member
  await Promise.all(
    itemLists.map(({ id: itemListId }) => {
      return Promise.all(
        users.map(({ id: userId }) => {
          return prisma.membersOfItemList.create({
            data: {
              itemListId,
              userId,
            },
          });
        })
      );
    })
  );
}

function getUsers() {
  return [
    {
      username: "john",
      password: "JOHN",
    },
    {
      username: "jane",
      password: "JANE",
    },
  ];
}

function getItemsList() {
  return [
    {
      description: "First Item List",
    },
    {
      description: "Second Item List",
    },
    {
      description: "Third Item List",
    },
  ];
}

function getItems() {
  return [
    {
      serial: "XX-123-091",
      description: "First Item",
      count: 1,
    },
    {
      serial: "XX-129-510",
      description: "Second Item",
      count: 2,
    },
    {
      serial: "XX-150-150",
      description: "Third Item",
      count: 3,
    },
    {
      serial: "XX-169-168",
      description: "Fourth Item",
      count: 4,
    },
    {
      serial: "XX-144-195",
      description: "Fifth Item",
      count: 5,
    },
  ];
}

seed();
