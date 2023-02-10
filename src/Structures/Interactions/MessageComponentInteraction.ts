import { ComponentType, InteractionResponseType, Routes } from "discord-api-types/v10";
import { Message } from "../Message";
import { BaseInteraction } from "./BaseInteraction";

export class MessageComponentInteraction extends BaseInteraction {
    public getRawMessage(): Message | null {
        return "message" in this.data && this.data.message ? new Message(this.data.message, this.client) : null;
    }

    public get componentType(): ComponentType | null {
        return this.data.data && "component_type" in this.data.data ? this.data.data.component_type : null;
    }

    public get customId(): string | null {
        return this.data.data && "custom_id" in this.data.data ? this.data.data.custom_id : null;
    }

    public get values(): string[] {
        return this.data.data && "values" in this.data.data ? this.data.data.values : [];
    }

    public async deferUpdate(): Promise<void> {
        await this.client.rest.post(Routes.interactionCallback(this.id, this.data.token), {
            body: {
                type: InteractionResponseType.DeferredMessageUpdate
            },
            auth: false
        });
        this.deferred = true;
    }
}
