import { BaseManager } from "./BaseManager";
import { Client } from "../Structures/Client";
import { RedisCollection } from "@nezuchan/redis-collection";
import { MakeCacheNameFunction } from "../Utilities/Functions";
import { KeyConstants } from "../Utilities/Enums/KeyConstants";
import { GuildMember } from "../Structures/GuildMember";
import { APIGuildMember } from "discord-api-types/v10";

export class GuildMemberManager extends BaseManager<APIGuildMember, GuildMember> {
    public constructor(
        client: Client
    ) {
        super(
            KeyConstants.MEMBER_KEY,
            client
        );
    }

    public override makeCache(): RedisCollection<APIGuildMember, GuildMember> {
        return new RedisCollection({
            hash: MakeCacheNameFunction(this.name, this.client.options.clientId!, this.client.options.gatewayRouting ?? false),
            redis: this.client.redis,
            deserialize: value => new GuildMember(JSON.parse(value as string) as APIGuildMember & { id: string }, this.client),
            serialize: value => JSON.stringify(value)
        });
    }

    public async resolve({ id, guildId }: { id: string; guildId: string }): Promise<GuildMember | null> {
        const member = await this.cache.get(`${guildId}:${id}`);
        return member ?? null;
    }

    public override _patch(old: GuildMember, data: APIGuildMember): APIGuildMember {
        return data;
    }
}
