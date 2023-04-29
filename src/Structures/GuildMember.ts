/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable no-nested-ternary */
import { APIGuildMember, APIRole, APIUser, GatewayGuildMemberRemoveDispatch, GatewayVoiceState, Routes } from "discord-api-types/v10";
import { Base } from "./Base.js";
import { User } from "./User.js";
import { Role } from "./Role.js";
import { VoiceState } from "./VoiceState.js";
import { GenKey } from "@nezuchan/utilities";
import { RedisKey } from "@nezuchan/constants";
import { Result } from "@sapphire/result";

export class GuildMember extends Base<APIGuildMember | GatewayGuildMemberRemoveDispatch["d"]> {
    public get id(): string {
        return this.data.id ?? this.data.user!.id;
    }

    public get guildId(): string | undefined {
        return "guild_id" in this.data ? this.data.guild_id : undefined;
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
        const roles = [];
        if (this.guildId) {
            for (const id of this.roles) {
                const role = await this.client.redis.get(GenKey(RedisKey.ROLE_KEY, id, this.guildId));
                if (role) {
                    roles.push(
                        new Role(
                            JSON.parse(role) as APIRole,
                            this.client
                        )
                    );
                }
            }
        }
        return roles;
    }

    public async resolveUser({ force = false, cache = true }: { force?: boolean; cache?: boolean }): Promise<User> {
        if (this.data.user) {
            return new User(this.data.user, this.client);
        }

        const user = await this.client.redis.get(GenKey(RedisKey.USER_KEY, this.id));
        if (user) {
            return new User(JSON.parse(user) as APIUser, this.client);
        }

        if (force) {
            const api_user = await Result.fromAsync(() => this.client.rest.get(Routes.user(this.id)));
            if (api_user.isOk()) {
                const user_value = api_user.unwrap() as APIUser;
                if (cache) await this.client.redis.set(GenKey(RedisKey.USER_KEY, this.id), JSON.stringify(user_value));
                return new User(user_value, this.client);
            }

            throw new Error(api_user.unwrapErr() as string);
        }

        throw new Error("User not found");
    }

    public async resolveVoiceState(): Promise<VoiceState | null> {
        if (this.guildId) {
            const state = await this.client.redis.get(GenKey(RedisKey.VOICE_KEY, this.id, this.guildId));
            if (state) {
                return new VoiceState({ ...JSON.parse(state) as GatewayVoiceState, id: this.id }, this.client);
            }
        }

        return null;
    }
}
