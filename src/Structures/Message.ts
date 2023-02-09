import { APIMessage, GatewayMessageCreateDispatchData, RESTPatchAPIChannelMessageJSONBody, Routes } from "discord-api-types/v10";
import { Base } from "./Base";
import { Guild } from "./Guild";

export class Message extends Base<APIMessage | GatewayMessageCreateDispatchData> {
    public get content(): string {
        return this.data.content;
    }

    public get guildId(): string | undefined {
        return "guild_id" in this.data ? this.data.guild_id : undefined;
    }

    public get channelId(): string {
        return this.data.channel_id;
    }

    public async fetchGuild(): Promise<Guild | null> {
        return this.guildId ? this.client.guilds.fetch({ id: this.guildId, cache: true }) : null;
    }

    public async edit(options: RESTPatchAPIChannelMessageJSONBody): Promise<Message> {
        return this.client.rest.patch(Routes.channelMessage(this.channelId, this.id), {
            body: options
        }).then(x => new Message(x as APIMessage, this.client));
    }
}
