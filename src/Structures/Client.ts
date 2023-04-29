/* eslint-disable no-negated-condition */
import EventEmitter from "node:events";
import { REST } from "@discordjs/rest";
import { Cluster, Redis } from "ioredis";
import { Message } from "./Message.js";
import { APIMessage, RESTPostAPIChannelMessageJSONBody, Routes } from "discord-api-types/v10";
import { RoutingKey, createAmqpChannel, createRedis } from "@nezuchan/utilities";
import { Channel } from "amqplib";
import { ClientOptions } from "../Typings/index.js";
import { RabbitMQ, RedisKey } from "@nezuchan/constants";
import { Events } from "../Enums/Events.js";

export class Client extends EventEmitter {
    public clientId: string;
    public rest = new REST({
        api: process.env.PROXY ?? process.env.NIRN_PROXY ?? "https://discord.com/api",
        rejectOnRateLimit: (process.env.PROXY ?? process.env.NIRN_PROXY) !== undefined ? () => false : null
    });

    public redis: Cluster | Redis;

    public amqp!: Channel;

    public constructor(
        public options: ClientOptions
    ) {
        super();
        this.redis = createRedis(this.options.redis);

        options.token ??= process.env.DISCORD_TOKEN;
        this.clientId = options.clientId ?? Buffer.from(options.token!.split(".")[0], "base64").toString();
    }

    public async connect(): Promise<void> {
        this.amqp = await createAmqpChannel(this.options.amqpUrl);

        await this.amqp.assertExchange(RabbitMQ.GATEWAY_QUEUE_SEND, "direct", { durable: false });
        const { queue } = await this.amqp.assertQueue("", { exclusive: true });

        if (Array.isArray(this.options.shardIds)) {
            for (const shard of this.options.shardIds) {
                await this.amqp.bindQueue(queue, RabbitMQ.GATEWAY_QUEUE_SEND, RoutingKey(this.clientId, shard));
            }
        } else if (this.options.shardIds.start >= 0 && this.options.shardIds.end >= 1) {
            for (let i = this.options.shardIds.start; i < this.options.shardIds.end; i++) {
                await this.amqp.bindQueue(queue, RabbitMQ.GATEWAY_QUEUE_SEND, RoutingKey(this.clientId, i));
            }
        } else {
            const shardCount = await this.redis.get(RedisKey.SHARDS_KEY);
            if (shardCount) {
                for (let i = 0; i < Number(shardCount); i++) {
                    await this.amqp.bindQueue(queue, RabbitMQ.GATEWAY_QUEUE_SEND, RoutingKey(this.clientId, i));
                }
            }
        }

        await this.amqp.consume(queue, message => {
            if (message) this.emit(Events.RAW, JSON.parse(message.content.toString()));
        });

        this.rest.setToken(this.options.token!);
    }

    public async sendMessage(options: RESTPostAPIChannelMessageJSONBody, channelId: string): Promise<Message> {
        return this.rest.post(Routes.channelMessages(channelId), {
            body: options
        }).then(x => new Message(x as APIMessage, this));
    }
}
