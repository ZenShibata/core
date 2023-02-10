import { GatewayVoiceState } from "discord-api-types/v10";
import { Base } from "./Base";
import { GuildMember } from "./GuildMember";

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

    public resolveMember(): Promise<GuildMember | null> {
        return this.client.members.resolve({ id: this.userId, guildId: this.guildId });
    }
}
