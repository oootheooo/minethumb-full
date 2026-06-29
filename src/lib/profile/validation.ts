const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

export const normalizeUsername = (value: string) => value.trim().toLowerCase();

export const validateProfileIdentity = (input: {
  firstName: string;
  lastName: string;
  username: string;
}) => {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const username = normalizeUsername(input.username);

  if (!firstName) {
    return { ok: false as const, message: 'First name is required.' };
  }

  if (firstName.length > 50) {
    return { ok: false as const, message: 'First name is too long.' };
  }

  if (!lastName) {
    return { ok: false as const, message: 'Last name is required.' };
  }

  if (lastName.length > 50) {
    return { ok: false as const, message: 'Last name is too long.' };
  }

  if (!username) {
    return { ok: false as const, message: 'Username is required.' };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return {
      ok: false as const,
      message: 'Username must be 3–30 characters and use only letters, numbers, or underscores.'
    };
  }

  return {
    ok: true as const,
    firstName,
    lastName,
    username
  };
};
