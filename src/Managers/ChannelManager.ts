import { APIChannel } from "discord-api-types/v10";
import { BaseManager } from "./BaseManager";
import { Client } from "../Structures/Client";
import { RedisCollection } from "@nezuchan/redis-collection";
import { MakeCacheNameFunction } from "../Utilities/Functions";
import { KeyConstants } from "../Utilities/Enums/KeyConstants";
import { BaseChannel } from "../Structures/BaseChannel";

export class ChannelManager extends BaseManager<APIChannel, BaseChannel> {
    public constructor(
        client: Client
    ) {
        super(
            KeyConstants.CHANNEL_KEY,
            client
        );
    }

    public override makeCache(): RedisCollection<APIChannel, BaseChannel> {
        return new RedisCollection({
            hash: MakeCacheNameFunction(this.name, this.client.options.clientId!, this.client.options.gatewayRouting ?? false),
            redis: this.client.redis,
            // TODO: Filter based on channel type.
            deserialize: value => new BaseChannel(JSON.parse(value as string) as APIChannel, this.client),
            serialize: value => JSON.stringify(value)
        });
    }

    public override _patch(old: BaseChannel, data: APIChannel): APIChannel {
        return data;
    }
}
