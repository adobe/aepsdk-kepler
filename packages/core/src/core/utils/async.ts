export function runAsync(f: Function): void {
    Promise.resolve().then(() => f());
}