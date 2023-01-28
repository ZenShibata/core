import EventEmitter from "node:events";
import { REST } from "@discordjs/rest";
import { Awaitable } from "@sapphire/utilities";
import { Cluster, Redis } from "ioredis";
import { ClientOptions } from "../Typings";
import { UserManager } from "../Managers/UserManager";

export class Client extends EventEmitter {
    public rest = new REST();
    public redis: Cluster | Redis;

    public users = new UserManager(this);

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

    public connect(): Awaitable<void> {
        this.rest.setToken(this.options.token!);
    }
}
