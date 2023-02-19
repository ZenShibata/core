import { APIInteractionResponseCallbackData, APIMessage, ApplicationCommandType, ComponentType, GatewayInteractionCreateDispatchData, InteractionResponseType, InteractionType, MessageFlags, PermissionFlagsBits, Routes, Snowflake } from "discord-api-types/v10";
import { Base } from "../Base";
import { CommandOptionsResolver } from "./CommandOptionsResolver";
import { PermissionsBitField } from "../PermissionsBitField";
import { GuildMember } from "../GuildMember";
import { Message } from "../Message";
import { CommandInteraction } from "./CommandInteraction";
import { BaseContextMenuInteraction } from "./BaseContextMenuInteraction";
import { AutoCompleteInteraction } from "./AutoCompleteInteraction";
import { MessageComponentInteraction } from "./MessageComponentInteraction";
import { ModalSubmitInteraction } from "./ModalSubmitInteraction";

export class BaseInteraction extends Base<GatewayInteractionCreateDispatchData> {
    public deferred = false;
    public replied = false;

    public get options(): CommandOptionsResolver {
        return new CommandOptionsResolver(this.data.data);
    }

    public get type(): InteractionType {
        return this.data.type;
    }

    public get commandType(): ApplicationCommandType | null {
        return this.data.data && "type" in this.data.data ? this.data.data.type : null;
    }

    public get applicationId(): Snowflake {
        return this.data.application_id;
    }

    public get channelId(): Snowflake | null {
        return this.data.channel_id ?? null;
    }

    public get guildId(): Snowflake {
        return this.data.guild_id!;
    }

    public get applicationPermissions(): PermissionsBitField | null {
        return this.data.app_permissions ? new PermissionsBitField(PermissionFlagsBits, BigInt(this.data.app_permissions)).freeze() : null;
    }

    public get memberPermissions(): PermissionsBitField | null {
        return this.data.member?.permissions ? new PermissionsBitField(PermissionFlagsBits, BigInt(this.data.member.permissions)).freeze() : null;
    }

    public get member(): GuildMember | null {
        return this.data.member ? new GuildMember({ id: this.data.member.user.id, ...this.data.member }, this.client) : null;
    }

    public async resolveClientMember(): Promise<GuildMember | null> {
        return this.guildId ? this.client.members.resolve({ id: this.applicationId, guildId: this.guildId }) : null;
    }

    public async reply(options: APIInteractionResponseCallbackData): Promise<this> {
        if (this.deferred || this.replied) return Promise.reject(new Error("This interaction has already been deferred or replied."));
        await this.client.rest.post(Routes.interactionCallback(this.id, this.data.token), {
            body: {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: options
            },
            auth: false
        });
        this.replied = true;
        return this;
    }

    public async editReply(options: APIInteractionResponseCallbackData): Promise<Message> {
        if (!this.deferred && !this.replied) return Promise.reject(new Error("This interaction is not deferred or replied yet."));
        const message = await this.client.rest.patch(Routes.webhookMessage(this.applicationId, this.data.token), {
            body: options,
            auth: false
        });
        this.replied = true;
        return new Message(message as APIMessage, this.client);
    }

    public async deleteReply(): Promise<this> {
        await this.client.rest.delete(Routes.webhookMessage(this.applicationId, this.data.token), {
            auth: false
        });
        return this;
    }

    public async deferReply(ephemeral?: boolean): Promise<this> {
        await this.client.rest.post(Routes.interactionCallback(this.id, this.data.token), {
            body: {
                type: InteractionResponseType.DeferredChannelMessageWithSource,
                data: {
                    flags: ephemeral ? MessageFlags.Ephemeral : undefined
                }
            },
            auth: false
        });
        this.deferred = true;
        return this;
    }

    public async followUp(options: APIInteractionResponseCallbackData): Promise<Message> {
        if (!this.deferred && !this.replied) return Promise.reject(new Error("This interaction is not deferred or replied yet."));
        const message = await this.client.rest.post(Routes.webhook(this.applicationId, this.data.token), {
            body: options,
            auth: false
        });
        return new Message(message as APIMessage, this.client);
    }

    public async showModal(options: APIInteractionResponseCallbackData): Promise<this> {
        if (this.deferred || this.replied) return Promise.reject(new Error("This interaction is already deferred or replied."));
        await this.client.rest.post(Routes.interactionCallback(this.id, this.data.token), {
            body: {
                type: InteractionResponseType.Modal,
                data: options
            },
            auth: false
        });
        this.replied = true;
        return this;
    }

    public isCommandInteraction(): this is CommandInteraction {
        return this.type === InteractionType.ApplicationCommand && this.commandType === ApplicationCommandType.ChatInput;
    }

    public isContextMenuInteraction(): this is BaseContextMenuInteraction {
        return this.type === InteractionType.ApplicationCommand && (this.commandType === ApplicationCommandType.User || this.commandType === ApplicationCommandType.Message);
    }

    public isAutoCompleteInteraction(): this is AutoCompleteInteraction {
        return this.data.type === InteractionType.ApplicationCommandAutocomplete;
    }

    public isComponentInteraction(): this is MessageComponentInteraction {
        return this.data.type === InteractionType.MessageComponent;
    }

    public isModalSubmit(): this is ModalSubmitInteraction {
        return this.data.type === InteractionType.ModalSubmit;
    }

    public isButton(): this is MessageComponentInteraction {
        return this.isComponentInteraction() && this.componentType === ComponentType.Button;
    }

    public isSelectMenu(): this is MessageComponentInteraction {
        return this.isComponentInteraction() && this.componentType === ComponentType.SelectMenu;
    }
}
