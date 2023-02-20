/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable no-nested-ternary */
import { APIGuildMember, GatewayGuildMemberRemoveDispatch } from "discord-api-types/v10";
import { Base } from "./Base";
import { User } from "./User";
import { Role } from "./Role";
import { KeyConstants } from "../Utilities/Enums/KeyConstants";
import { VoiceState } from "./VoiceState";
import { MakeCacheNameFunction } from "../Utilities/Functions";

export class GuildMember extends Base<APIGuildMember | GatewayGuildMemberRemoveDispatch["d"]> {
    public get id(): string {
        return this.data.id ?? this.data.user!.id;
    }

    public get nickname(): string | null | undefined {
        return "nick" in this.data ? this.data.nick : null;
    }

    public get roles(): string[] {
        return "roles" in this.data ? this.data.roles : [];
    }

    public get joinedAt(): Date | undefined {
        return "joined_at" in this.data ? this.data.joined_at ? new Date(this.data.joined_at) : undefined : undefined;
    }

    public get premiumSince(): Date | undefined {
        return "premium_since" in this.data ? this.data.premium_since ? new Date(this.data.premium_since) : undefined : undefined;
    }

    public async resolveRoles(): Promise<Role[]> {
        const keys = await this.client.redis.smembers(
            MakeCacheNameFunction(KeyConstants.ROLE_KEY + KeyConstants.KEYS_SUFFIX, this.client.options.clientId!, this.client.options.gatewayRouting ?? false)
        );

        const roles = [];

        for (const id of this.roles) {
            const role = await this.client.roles.resolve({ id, keys });
            if (role) roles.push(role);
        }
        return roles;
    }

    public async resolveUser(): Promise<User> {
        return this.data.user ? new User(this.data.user, this.client) : this.client.users.fetch({ id: this.data.id });
    }

    public async resolveVoiceState(guildId: string): Promise<VoiceState | null> {
        const voiceState = await this.client.voiceStates.resolve({ id: this.data.id, guildId });
        return voiceState;
    }
}
