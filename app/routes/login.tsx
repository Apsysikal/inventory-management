import type { ActionArgs } from "@remix-run/node";
import { Form, useActionData, useSearchParams } from "@remix-run/react";
import { badRequest } from "~/utilities/request.server";
import { createUserSession, login } from "~/utilities/session.server";

export async function action({ request }: ActionArgs) {
  const form = await request.formData();
  const redirectTo = validateRedirect(form.get("redirectTo"));
  const username = form.get("username") as string;
  const password = form.get("password") as string;

  const fieldErrors = {
    username: validateUsername(username),
    password: validatePassword(password),
  };

  const fields = {
    username,
    password,
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors,
      formError: undefined,
    });
  }

  const user = await login(fields.username, fields.password);

  if (!user) {
    return badRequest({
      fields,
      fieldErrors,
      formError: undefined,
    });
  }

  return createUserSession(user.id, redirectTo);
}

export default function LoginRoute() {
  const [searchParams] = useSearchParams();
  const redirectTo = validateRedirect(searchParams.get("redirectTo") as string);
  const actionData = useActionData<typeof action>();

  return (
    <>
      <Form method="post">
        <div>
          <input type="hidden" name="redirectTo" value={redirectTo} />
        </div>
        <div>
          <label htmlFor="input-username">Username</label>
          <input
            type="text"
            name="username"
            id="input-username"
            defaultValue={actionData?.fields.username}
            aria-invalid={Boolean(actionData?.fieldErrors.username)}
            aria-errormessage={
              actionData?.fieldErrors.username ? "username-error" : undefined
            }
          />
          {actionData?.fieldErrors.username && (
            <p id="username-error">{actionData.fieldErrors.username}</p>
          )}
        </div>
        <div>
          <label htmlFor="input-password">Password</label>
          <input
            type="password"
            name="password"
            id="input-password"
            defaultValue={actionData?.fields.password}
            aria-invalid={Boolean(actionData?.fieldErrors.password)}
            aria-errormessage={
              actionData?.fieldErrors.password ? "password-error" : undefined
            }
          />
          {actionData?.fieldErrors.password && (
            <p id="password-error">{actionData.fieldErrors.password}</p>
          )}
        </div>
        <div>
          <button type="submit">Login</button>
        </div>
      </Form>
    </>
  );
}

function validateRedirect(redirectTo: any) {
  const validRedirects = ["/", "/list", "/list/new"];

  if (!redirectTo) return "/";
  if (typeof redirectTo !== "string") return "/";

  const isValid = validRedirects.includes(redirectTo);
  return isValid ? redirectTo : "/";
}

function validateUsername(username: FormDataEntryValue | null) {
  if (!username) return "You must provide a username";
  if (typeof username !== "string") return "You must provide a valid username";
  if (username.length < 2) return "That username is too short";
  if (username.length > 40) return "That username is too long";
}

function validatePassword(password: FormDataEntryValue | null) {
  if (!password) return "You must provide a password";
  if (typeof password !== "string") return "You must provide a valid password";
  if (password.length < 4) return "That password is too short";
}
