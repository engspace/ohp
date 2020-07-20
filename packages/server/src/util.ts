import path from 'path';

export function unimplemented(name?: string): never {
    throw new Error(`Unimplemented${name ? ': ' + name : ''}`);
}

/**
 *  returns a path within the @ohp/server source tree
 */
export function ohpTreePath(relPath: string): string {
    return path.normalize(path.join(__dirname, '..', relPath));
}
