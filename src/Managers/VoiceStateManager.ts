import { GatewayVoiceState } from "discord-api-types/v10";
import { BaseManager } from "./BaseManager";
import { VoiceState } from "../Structures/VoiceState";
import { KeyConstants } from "../Utilities/Enums/KeyConstants";
import { Client } from "../Structures/Client";
import { RedisCollection } from "@nezuchan/redis-collection";
import { MakeCacheNameFunction } from "../Utilities/Functions";

export class VoiceStateManager extends BaseManager<GatewayVoiceState, VoiceState> {
    public constructor(
        client: Client
    ) {
        super(
            KeyConstants.VOICE_KEY,
            client
        );
    }

    public override makeCache(): RedisCollection<GatewayVoiceState, VoiceState> {
        return new RedisCollection({
            hash: MakeCacheNameFunction(this.name, this.client.options.clientId!, this.client.options.gatewayRouting ?? false),
            redis: this.client.redis,
            deserialize: value => new VoiceState(JSON.parse(value as string) as GatewayVoiceState & { id: string }, this.client),
            serialize: value => JSON.stringify(value)
        });
    }

    public async resolve({ id, guildId }: { id: string; guildId: string }): Promise<VoiceState | null> {
        const voiceState = await this.cache.get(`${guildId}:${id}`);
        return voiceState ?? null;
    }

    public override _patch(old: VoiceState, data: GatewayVoiceState): GatewayVoiceState {
        return data;
    }
}
