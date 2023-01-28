/* eslint-disable @typescript-eslint/no-unused-vars */
import { RedisCollection } from "@nezuchan/redis-collection";
import { Client } from "../Structures/Client";

export abstract class BaseManager<RawType, Holds> {
    public cache: RedisCollection<RawType, Holds>;
    public constructor(
        public name: string,
        public client: Client
    ) {
        this.cache = this.makeCache();
    }

    protected async _add(key: string, data: RawType, cache = true): Promise<RawType> {
        const existing = await this.cache.get(key);
        if (existing) {
            if (cache) {
                const patch = this._patch(existing, data);
                await this.cache.set(key, patch);
                return patch;
            }
            const patch = this._patch(existing, data);
            return patch;
        }

        if (cache) await this.cache.set(key, data);
        return data;
    }

    protected abstract _patch(old: Holds, data: RawType): RawType;
    protected abstract makeCache(): RedisCollection<RawType, Holds>;
}
