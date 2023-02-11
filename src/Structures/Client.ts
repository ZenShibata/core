/* eslint-disable no-negated-condition */
import EventEmitter from "node:events";
import { REST } from "@discordjs/rest";
import { Cluster, Redis } from "ioredis";
import { ClientOptions } from "../Typings";
import { RabbitConstants } from "../Utilities/Enums/RabbitConstants";
import { RoutingPublisher, RoutingSubscriber, createAmqp } from "@nezuchan/cordis-brokers";

import { UserManager } from "../Managers/UserManager";
import { GuildManager } from "../Managers/GuildManager";
import { ChannelManager } from "../Managers/ChannelManager";
import { Message } from "./Message";
import { APIMessage, RESTPostAPIChannelMessageJSONBody, Routes } from "discord-api-types/v10";
import { RoleManager } from "../Managers/RoleManager";
import { GuildMemberManager } from "../Managers/GuildMemberManager";
import { VoiceStateManager } from "../Managers/VoiceStateManager";

export class Client extends EventEmitter {
    public rest = new REST({
        api: process.env.PROXY ?? process.env.NIRN_PROXY ?? "https://discord.com/api",
        rejectOnRateLimit: (process.env.PROXY ?? process.env.NIRN_PROXY) !== undefined ? () => false : null
    });

    public redis: Cluster | Redis;

    public users: UserManager;
    public guilds: GuildManager;
    public channels: ChannelManager;
    public roles: RoleManager;
    public members: GuildMemberManager;
    public voiceStates: VoiceStateManager;

    public amqp!: {
        sender: RoutingPublisher<string, Record<string, any>>;
        receiver: RoutingSubscriber<string, Record<string, any>>;
    };

    public constructor(
        public options: ClientOptions
    ) {
        super();
        if (options.redis.clusters?.length) {
            this.redis = new Cluster(
                options.redis.clusters,
                {
                    scaleReads: options.redis.scaleReads ?? "all",
                    redisOptions: options.redis.options
                }
            );
        } else {
            this.redis = new Redis(options.redis.options);
        }

        options.token ??= process.env.DISCORD_TOKEN;
        options.clientId ??= Buffer.from(options.token!.split(".")[0], "base64").toString();

        this.members = new GuildMemberManager(this);
        this.voiceStates = new VoiceStateManager(this);
        this.channels = new ChannelManager(this);
        this.guilds = new GuildManager(this);
        this.users = new UserManager(this);
        this.roles = new RoleManager(this);
    }

    public async connect(): Promise<void> {
        const { channel } = await createAmqp(process.env.AMQP_HOST ?? process.env.AMQP_URL ?? this.options.amqpUrl);

        this.amqp = {
            sender: new RoutingPublisher(channel),
            receiver: new RoutingSubscriber(channel)
        };

        if (this.options.gatewayRouting || process.env.USE_ROUTING === "true") {
            await this.amqp.receiver.init({ name: RabbitConstants.QUEUE_RECV, useExchangeBinding: true, exchangeType: "direct", keys: this.options.clientId!, durable: true });
        } else {
            await this.amqp.receiver.init({ name: RabbitConstants.QUEUE_RECV, useExchangeBinding: true, exchangeType: "fanout", keys: "#", durable: true });
        }

        await this.amqp.sender.init({ name: RabbitConstants.QUEUE_SEND, useExchangeBinding: true });
        this.rest.setToken(this.options.token!);
    }

    public async sendMessage(options: RESTPostAPIChannelMessageJSONBody, channelId: string): Promise<Message> {
        return this.rest.post(Routes.channelMessages(channelId), {
            body: options
        }).then(x => new Message(x as APIMessage, this));
    }
}
