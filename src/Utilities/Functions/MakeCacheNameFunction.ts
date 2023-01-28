export const MakeCacheNameFunction = (name: string, clientId: string, routing: boolean): string => {
    switch (name) {
        default:
            return routing ? `${clientId}:${name}` : name;
    }
};

