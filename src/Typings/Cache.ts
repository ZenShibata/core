import { RedisCollection } from "@nezuchan/redis-collection";
import { UserManager } from "../Managers/UserManager";
import { BaseManager } from "../Managers/BaseManager";
import { User } from "../Structures/User";
import { ChannelManager } from "../Managers/ChannelManager";
import { BaseChannel } from "../Structures/BaseChannel";

export interface Caches {
    UserManager: [manager: typeof UserManager, holds: typeof User];
    ChannelManager: [manager: typeof ChannelManager, holds: typeof BaseChannel];
}

export type CacheConstructors = {
    [K in keyof Caches]: Caches[K][0] & { name: K };
};

export type CacheFactory = (
    manager: CacheConstructors[keyof Caches],
    holds: Caches[(typeof manager)["name"]][1],
) => (typeof manager)["prototype"] extends BaseManager<infer V, infer R> ? RedisCollection<V, R> : never;
