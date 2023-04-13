import { ClusterNode, NatMap, NodeRole, RedisOptions } from "ioredis";
import { CacheFactory } from "./Cache";

export interface ClientOptions {
    token?: string;
    clientId?: string;
    amqpUrl: string;
    redis: {
        natMap?: NatMap;
        options: RedisOptions;
        clusters?: ClusterNode[];
        scaleReads?: NodeRole;
    };
    gatewayRouting?: boolean;
    makeCache?: CacheFactory;
}
