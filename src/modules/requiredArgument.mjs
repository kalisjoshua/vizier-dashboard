export function requiredArg(parent = requiredArg("requiredArg", "parent"), name = requiredArg("requiredArg", "name")) {
  throw new Error(`Argument "${name}" must be provided for "${parent}".`);
}
