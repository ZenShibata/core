import { APIRole } from "discord-api-types/v10";
import { BaseManager } from "./BaseManager";
import { Role } from "../Structures/Role";
import { KeyConstants } from "../Utilities/Enums/KeyConstants";
import { Client } from "../Structures/Client";
import { RedisCollection } from "@nezuchan/redis-collection";
import { MakeCacheNameFunction } from "../Utilities/Functions";

export class RoleManager extends BaseManager<APIRole, Role> {
    public constructor(
        client: Client
    ) {
        super(
            KeyConstants.ROLE_KEY,
            client
        );
    }

    public override makeCache(): RedisCollection<APIRole, Role> {
        return new RedisCollection({
            hash: MakeCacheNameFunction(this.name, this.client.options.clientId!, this.client.options.gatewayRouting ?? false),
            redis: this.client.redis,
            deserialize: value => new Role(JSON.parse(value as string) as APIRole, this.client),
            serialize: value => JSON.stringify(value)
        });
    }

    public async resolve({ id, keys }: { id: string; keys?: string[] }): Promise<Role | null> {
        keys ??= await this.client.redis.smembers(`${KeyConstants.ROLE_KEY}${KeyConstants.KEYS_SUFFIX}`);
        const key = keys.find(key => key.includes(id));
        if (!key) return null;
        const role = await this.cache.get(key);
        return role ?? null;
    }

    public override _patch(old: Role, data: APIRole): APIRole {
        return data;
    }
}
