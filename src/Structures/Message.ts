import { APIMessage, GatewayMessageCreateDispatchData } from "discord-api-types/v10";
import { Base } from "./Base";
import { Guild } from "./Guild";

export class Message extends Base<APIMessage | GatewayMessageCreateDispatchData> {
    public get content(): string {
        return this.data.content;
    }

    public get guildId(): string | undefined {
        return "guild_id" in this.data ? this.data.guild_id : undefined;
    }

    public async fetchGuild(): Promise<Guild | null> {
        return this.guildId ? this.client.guilds.fetch({ id: this.guildId, cache: true }) : null;
    }
}
