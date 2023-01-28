import { ClusterNode, NodeRole, RedisOptions } from "ioredis";
import { CacheFactory } from "./Cache";

export interface ClientOptions {
    token?: string;
    clientId?: string;
    amqpUrl: string;
    redis: {
        options: RedisOptions;
        clusters?: ClusterNode[];
        scaleReads?: NodeRole;
    };
    gatewayRouting?: boolean;
    makeCache?: CacheFactory;
}
