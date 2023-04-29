import { APIChannel, APIGuild, APIOverwrite, APIRole, ChannelFlags, ChannelType, GatewayGuildCreateDispatchData, OverwriteType, PermissionFlagsBits, RESTPostAPIChannelMessageJSONBody, Routes } from "discord-api-types/v10";
import { Base } from "./Base.js";
import { Message } from "./Message.js";
import { TextChannel } from "./TextChannel.js";
import { VoiceChannel } from "./VoiceChannel.js";
import { GuildMember } from "./GuildMember.js";
import { PermissionsBitField } from "./PermissionsBitField.js";
import { Guild } from "./Guild.js";
import { GenKey } from "@nezuchan/utilities";
import { Result } from "@sapphire/result";
import { RedisKey } from "@nezuchan/constants";
import { Role } from "./Role.js";

export class BaseChannel extends Base<APIChannel> {
    public get guildId(): string | undefined {
        return "guild_id" in this.data ? this.data.guild_id : undefined;
    }

    public get name(): string {
        return this.name;
    }

    public get type(): ChannelType {
        return this.data.type;
    }

    public get flags(): ChannelFlags | undefined {
        return this.data.flags;
    }

    public async send(options: RESTPostAPIChannelMessageJSONBody): Promise<Message> {
        return this.client.sendMessage(options, this.id);
    }

    public isVoice(): this is VoiceChannel {
        return this.type === ChannelType.GuildVoice;
    }

    public isText(): this is TextChannel {
        return ![
            ChannelType.GuildStageVoice, ChannelType.GuildVoice
        ].includes(this.type);
    }

    public isSendable(): boolean {
        return ![ChannelType.GuildCategory, ChannelType.GuildDirectory, ChannelType.GuildForum].includes(this.type);
    }

    public get permissionOverwrites(): APIOverwrite[] {
        return "permission_overwrites" in this.data ? this.data.permission_overwrites ?? [] : [];
    }

    public async permissionsForMember(member: GuildMember): Promise<PermissionsBitField> {
        if (!this.guildId) return new PermissionsBitField(PermissionFlagsBits, 0n);
        const guild = await this.resolveGuild();

        if (member.id === guild?.ownerId) {
            return new PermissionsBitField(PermissionFlagsBits, Object.values(PermissionFlagsBits).reduce((a, b) => a | b, 0n));
        }

        const roles = await member.resolveRoles();
        const everyoneRole = await this.client.redis.get(GenKey(RedisKey.ROLE_KEY, this.guildId, this.guildId));
        if (everyoneRole) {
            roles.push(
                new Role(
                    JSON.parse(everyoneRole) as APIRole,
                    this.client
                )
            );
        }

        const permissions = new PermissionsBitField(PermissionFlagsBits, roles.reduce((a, b) => a | b.permissions.bits, 0n));

        if (permissions.bits & PermissionFlagsBits.Administrator) {
            return new PermissionsBitField(PermissionFlagsBits, Object.values(PermissionFlagsBits).reduce((a, b) => a | b, 0n));
        }

        const overwrites = {
            everyone: { allow: 0n, deny: 0n },
            roles: { allow: 0n, deny: 0n },
            member: { allow: 0n, deny: 0n }
        };

        for (const overwrite of this.permissionOverwrites) {
            if (overwrite.type === OverwriteType.Role) {
                if (overwrite.id === guild?.id) {
                    overwrites.everyone.deny |= BigInt(overwrite.deny);
                    overwrites.everyone.allow |= BigInt(overwrite.allow);
                } else if (roles.find(x => x.id === overwrite.id)) {
                    overwrites.roles.deny |= BigInt(overwrite.deny);
                    overwrites.roles.allow |= BigInt(overwrite.allow);
                }
            } else if (overwrite.id === member.id) {
                overwrites.member.deny |= BigInt(overwrite.deny);
                overwrites.member.allow |= BigInt(overwrite.allow);
            }
        }

        return permissions
            .remove(overwrites.everyone.deny)
            .add(overwrites.everyone.allow)
            .remove(overwrites.roles.deny)
            .add(overwrites.roles.allow)
            .remove(overwrites.member.deny)
            .add(overwrites.member.allow)
            .freeze();
    }

    public async resolveGuild(): Promise<Guild | null> {
        if (this.guildId) {
            const cached_guild = await this.client.redis.get(GenKey(this.client.clientId, this.guildId));
            if (cached_guild) {
                return new Guild(JSON.parse(cached_guild) as APIGuild | GatewayGuildCreateDispatchData, this.client);
            }

            const guild = await Result.fromAsync(() => this.client.rest.get(Routes.guild(this.guildId!)));

            if (guild.isOk()) {
                await this.client.redis.set(GenKey(this.client.clientId, RedisKey.GUILD_KEY, this.guildId), JSON.stringify(guild));
                return new Guild(guild.unwrap() as APIGuild | GatewayGuildCreateDispatchData, this.client);
            }
        }

        return null;
    }
}
