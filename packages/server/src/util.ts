export function unimplemented(name?: string): never {
    throw new Error(`Unimplemented${name ? ': ' + name : ''}`);
}
