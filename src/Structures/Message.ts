import { APIMessage, GatewayMessageCreateDispatchData, GatewayMessageDeleteDispatch, GatewayMessageUpdateDispatch, RESTPatchAPIChannelMessageJSONBody, Routes } from "discord-api-types/v10";
import { Base } from "./Base";
import { Guild } from "./Guild";
import { User } from "./User";
import { GuildMember } from "./GuildMember";

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

    public async fetchGuild(): Promise<Guild | null> {
        return this.guildId ? this.client.guilds.fetch({ id: this.guildId, cache: true }) : null;
    }

    public get author(): User | null {
        return "author" in this.data ? new User(this.data.author, this.client) : null;
    }

    public resolveMember(): Promise<GuildMember | null> {
        return this.guildId ? this.client.members.resolve({ id: this.author!.id, guildId: this.guildId }) : Promise.resolve(null);
    }

    public async edit(options: RESTPatchAPIChannelMessageJSONBody): Promise<Message> {
        return this.client.rest.patch(Routes.channelMessage(this.channelId!, this.id), {
            body: options
        }).then(x => new Message(x as APIMessage, this.client));
    }
}
