/* eslint-disable max-len */
import { APIGuild, APIGuildMember, APIMessage, GatewayGuildCreateDispatchData, GatewayGuildMemberRemoveDispatchData, GatewayMessageCreateDispatchData, GatewayMessageDeleteDispatch, GatewayMessageUpdateDispatch, RESTPatchAPIChannelMessageJSONBody, Routes } from "discord-api-types/v10";
import { Base } from "./Base.js";
import { Guild } from "./Guild.js";
import { User } from "./User.js";
import { GuildMember } from "./GuildMember.js";
import { GenKey } from "@nezuchan/utilities";
import { RedisKey } from "@nezuchan/constants";
import { Result } from "@sapphire/result";

export class Message extends Base<APIMessage | GatewayMessageCreateDispatchData | GatewayMessageDeleteDispatch | GatewayMessageUpdateDispatch> {
    public get content(): string {
        return "content" in this.data ? this.data.content : "";
    }

    public get guildId(): string | undefined {
        return "guild_id" in this.data ? this.data.guild_id : undefined;
    }

    public get channelId(): string | null {
        return "channel_id" in this.data ? this.data.channel_id : null;
    }

    public get webhookId(): string | undefined {
        return "webhook_id" in this.data ? this.data.webhook_id : undefined;
    }

    public async resolveGuild({ force = false, cache = true }: { force?: boolean; cache?: boolean }): Promise<Guild | null> {
        if (this.guildId) {
            const cached_guild = await this.client.redis.get(GenKey(this.client.clientId, this.guildId));
            if (cached_guild) {
                return new Guild(JSON.parse(cached_guild) as APIGuild | GatewayGuildCreateDispatchData, this.client);
            }

            if (force) {
                const api_guild = await Result.fromAsync(() => this.client.rest.get(Routes.guild(this.guildId!)));

                if (api_guild.isOk()) {
                    const guild_value = api_guild.unwrap() as APIGuild | GatewayGuildCreateDispatchData;
                    if (cache) await this.client.redis.set(GenKey(this.client.clientId, RedisKey.GUILD_KEY, this.guildId), JSON.stringify(guild_value));
                    return new Guild(guild_value, this.client);
                }
            }
        }

        return null;
    }

    public get author(): User | null {
        return "author" in this.data ? new User(this.data.author, this.client) : null;
    }

    public async resolveMember({ force = false, cache = true }: { force?: boolean; cache?: boolean }): Promise<GuildMember | null> {
        if (this.guildId && this.author) {
            const api_member = "member" in this.data ? this.data.member : null;
            if (api_member) {
                return new GuildMember({ ...api_member, id: this.author.id, guild_id: this.guildId }, this.client);
            }

            const cached_member = await this.client.redis.get(GenKey(this.client.clientId, RedisKey.MEMBER_KEY, this.author.id, this.guildId));
            if (cached_member) {
                return new GuildMember({ ...JSON.parse(cached_member) as APIGuildMember | GatewayGuildMemberRemoveDispatchData, id: this.author.id, guild_id: this.guildId }, this.client);
            }

            if (force) {
                const member = await Result.fromAsync(() => this.client.rest.get(Routes.guildMember(this.guildId!, this.author!.id)));
                if (member.isOk()) {
                    const member_value = member.unwrap() as APIGuildMember | GatewayGuildMemberRemoveDispatchData;
                    if (cache) await this.client.redis.set(GenKey(this.client.clientId, RedisKey.MEMBER_KEY, this.author.id, this.guildId), JSON.stringify(member_value));
                    return new GuildMember({ ...member_value, id: this.author.id, guild_id: this.guildId }, this.client);
                }
            }
        }

        return null;
    }

    public async edit(options: RESTPatchAPIChannelMessageJSONBody): Promise<Message> {
        return this.client.rest.patch(Routes.channelMessage(this.channelId!, this.id), {
            body: options
        }).then(x => new Message(x as APIMessage, this.client));
    }
}
