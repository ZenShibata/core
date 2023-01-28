import { APIUser, Routes } from "discord-api-types/v10";
import { BaseManager } from "./BaseManager";
import { User } from "../Structures/User";
import { Client } from "../Structures/Client";
import { RedisCollection } from "@nezuchan/redis-collection";
import { MakeCacheNameFunction } from "../Utilities/Functions";
import { KeyConstants } from "../Utilities/Enums/KeyConstants";

export class UserManager extends BaseManager<APIUser, User> {
    public constructor(
        client: Client
    ) {
        super(
            KeyConstants.USER_KEY,
            client
        );
    }

    public override makeCache(): RedisCollection<APIUser, User> {
        return new RedisCollection({
            hash: MakeCacheNameFunction(this.name, this.client.options.clientId!, this.client.options.gatewayRouting ?? false),
            redis: this.client.redis,
            deserialize: value => new User(JSON.parse(value as string) as APIUser, this.client),
            serialize: value => JSON.stringify(value)
        });
    }

    public async fetchMe({ force = false, cache = true }: { force?: boolean; cache?: boolean }): Promise<User> {
        if (force) {
            const me = await this.client.rest.get(Routes.user()) as APIUser;
            return new User(await this._add(this.client.options.clientId!, me, cache), this.client);
        }

        const existing = await this.cache.get(this.client.options.clientId!);
        return existing ?? new User(await this._add(this.client.options.clientId!, await this.client.rest.get(Routes.user()) as APIUser, cache), this.client);
    }

    public override _patch(old: User, data: APIUser): APIUser {
        return data;
    }
}
