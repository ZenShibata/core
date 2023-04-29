/* eslint-disable max-len */
import { APIGuildMember, GatewayGuildMemberRemoveDispatchData, GatewayVoiceState, Routes } from "discord-api-types/v10";
import { Base } from "./Base.js";
import { GuildMember } from "./GuildMember.js";
import { Result } from "@sapphire/result";
import { GenKey } from "@nezuchan/utilities";
import { RedisKey } from "@nezuchan/constants";

export class VoiceState extends Base<GatewayVoiceState> {
    public get guildId(): string {
        return this.data.guild_id!;
    }

    public get userId(): string {
        return this.data.user_id;
    }

    public get channelId(): string | null {
        return this.data.channel_id;
    }

    public get sessionId(): string {
        return this.data.session_id;
    }

    public get deaf(): boolean {
        return this.data.deaf;
    }

    public get mute(): boolean {
        return this.data.mute;
    }

    public get selfDeaf(): boolean {
        return this.data.self_deaf;
    }

    public get selfMute(): boolean {
        return this.data.self_mute;
    }

    public get requestToSpeakTimestamp(): Date | null {
        return this.data.request_to_speak_timestamp ? new Date(this.data.request_to_speak_timestamp) : null;
    }

    public async resolveMember({ force = false, cache = true }: { force?: boolean; cache?: boolean }): Promise<GuildMember | null> {
        if (this.guildId && this.userId) {
            const raw_member = "member" in this.data ? this.data.member : null;
            if (raw_member) {
                return new GuildMember({ ...raw_member, id: this.userId, guild_id: this.guildId }, this.client);
            }

            const cached_member = await this.client.redis.get(GenKey(this.client.clientId, RedisKey.MEMBER_KEY, this.userId, this.guildId));
            if (cached_member) {
                return new GuildMember({ ...JSON.parse(cached_member) as APIGuildMember | GatewayGuildMemberRemoveDispatchData, id: this.userId, guild_id: this.guildId }, this.client);
            }

            if (force) {
                const api_member = await Result.fromAsync(() => this.client.rest.get(Routes.guildMember(this.guildId, this.userId)));
                if (api_member.isOk()) {
                    const member_value = api_member.unwrap() as APIGuildMember | GatewayGuildMemberRemoveDispatchData;
                    if (cache) await this.client.redis.set(GenKey(this.client.clientId, RedisKey.MEMBER_KEY, this.userId, this.guildId), JSON.stringify(member_value));
                    return new GuildMember({ ...member_value, id: this.userId, guild_id: this.guildId }, this.client);
                }
            }
        }

        return null;
    }
}
