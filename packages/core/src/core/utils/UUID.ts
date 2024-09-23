export function uuid(): string {
  // TODO: Implement a better UUID generator, such as https://github.com/uuidjs/uuid
  return Math.random().toString(36);
}
