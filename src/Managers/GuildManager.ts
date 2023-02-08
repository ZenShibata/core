import { APIGuild, Routes } from "discord-api-types/v10";
import { BaseManager } from "./BaseManager";
import { Client } from "../Structures/Client";
import { RedisCollection } from "@nezuchan/redis-collection";
import { MakeCacheNameFunction } from "../Utilities/Functions";
import { KeyConstants } from "../Utilities/Enums/KeyConstants";
import { Guild } from "../Structures/Guild";

export class GuildManager extends BaseManager<APIGuild, Guild> {
    public constructor(
        client: Client
    ) {
        super(
            KeyConstants.GUILD_KEY,
            client
        );
    }

    public override makeCache(): RedisCollection<APIGuild, Guild> {
        return new RedisCollection({
            hash: MakeCacheNameFunction(this.name, this.client.options.clientId!, this.client.options.gatewayRouting ?? false),
            redis: this.client.redis,
            deserialize: value => new Guild(JSON.parse(value as string) as APIGuild, this.client),
            serialize: value => JSON.stringify(value)
        });
    }

    public async fetch({ force = false, cache = true, id }: { force?: boolean; cache?: boolean; id: string }): Promise<Guild> {
        if (force) {
            const me = await this.client.rest.get(Routes.guild(id)) as APIGuild;
            return new Guild(await this._add(this.client.options.clientId!, me, cache), this.client);
        }

        const existing = await this.cache.get(id);
        return existing ?? new Guild(await this._add(this.client.options.clientId!, await this.client.rest.get(Routes.guild(id)) as APIGuild, cache), this.client);
    }

    public override _patch(old: Guild, data: APIGuild): APIGuild {
        return data;
    }
}
