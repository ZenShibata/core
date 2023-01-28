import { APIUser } from "discord-api-types/v10";
import { BaseManager } from "./BaseManager";
import { User } from "../Structures/User";
import { Client } from "../Structures/Client";
import { RedisCollection } from "@nezuchan/redis-collection";
import { MakeCacheNameFunction } from "../Utilities/Functions";

export class UserManager extends BaseManager<APIUser, User> {
    public constructor(
        client: Client
    ) {
        super(
            "users",
            client
        );
    }

    public override makeCache(): RedisCollection<APIUser, User> {
        return new RedisCollection({
            hash: MakeCacheNameFunction(this.name, this.client.options.clientId!, this.client.options.gatewayRouting ?? false),
            redis: this.client.redis,
            deserialize(value) {
                return new User(JSON.parse(value as string) as APIUser);
            },
            serialize(value) {
                return JSON.stringify(value);
            }
        });
    }

    public override _patch(old: User, data: APIUser): APIUser {
        return data;
    }
}
