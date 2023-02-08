import EventEmitter from "node:events";
import { REST } from "@discordjs/rest";
import { Cluster, Redis } from "ioredis";
import { ClientOptions } from "../Typings";
import { RabbitConstants } from "../Utilities/Enums/RabbitConstants";
import { RoutingPublisher, RoutingSubscriber, createAmqp } from "@nezuchan/cordis-brokers";

import { UserManager } from "../Managers/UserManager";
import { GuildManager } from "../Managers/GuildManager";
import { ChannelManager } from "../Managers/ChannelManager";

export class Client extends EventEmitter {
    public rest = new REST();
    public redis: Cluster | Redis;

    public users = new UserManager(this);
    public guilds = new GuildManager(this);
    public channels = new ChannelManager(this);

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
    }

    public async connect(): Promise<void> {
        const { channel } = await createAmqp(process.env.AMQP_HOST ?? process.env.AMQP_URL!);

        this.amqp = {
            sender: new RoutingPublisher(channel),
            receiver: new RoutingSubscriber(channel)
        };

        if (process.env.USE_ROUTING === "true") {
            await this.amqp.receiver.init({ name: RabbitConstants.QUEUE_RECV, useExchangeBinding: true, exchangeType: "direct", keys: this.options.clientId!, durable: true });
        } else {
            await this.amqp.receiver.init({ name: RabbitConstants.QUEUE_RECV, useExchangeBinding: true, exchangeType: "fanout", keys: "#", durable: true });
        }

        await this.amqp.sender.init({ name: RabbitConstants.QUEUE_SEND, useExchangeBinding: true });

        this.rest.setToken(this.options.token!);
    }
}
