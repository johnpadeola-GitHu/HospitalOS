// Deliberately its own file, separate from AuthContext.jsx — plain
// functions mixed into a file that also exports React components/hooks
// breaks Fast Refresh, which oxlint correctly flags. These are needed
// before a user is signed in at all (the sign-in screen itself), so
// they can't depend on AuthContext being mounted with a real session.
//
// Deliberately separate from the session token too, and deliberately
// NOT cleared on sign-out — this is a pure convenience for shared
// hospital workstations, where the same device sees many different
// staff across a shift. Storing an email locally changes nothing about
// the actual authentication: the password is still required in full
// and verified server-side on every sign-in exactly as before. This
// never stores a password, a token, or anything else that could itself
// grant access — only the email address, which is no more sensitive
// than what's already visible in a staff directory.
const LAST_EMAIL_KEY = "hospitalos_last_email";

export function getRememberedEmail() {
  return localStorage.getItem(LAST_EMAIL_KEY) || "";
}

export function rememberEmail(email) {
  localStorage.setItem(LAST_EMAIL_KEY, email);
}

export function forgetRememberedEmail() {
  localStorage.removeItem(LAST_EMAIL_KEY);
}
