import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { SecretsManagerClientConfig } from '@aws-sdk/client-secrets-manager';
import type { Middleware } from '@lamware/core';
import type { Handler } from 'aws-lambda';

export interface Config extends SecretsManagerClientConfig {
    /**
     * Optionally provide a custom Secrets Manager Client/options.
     */
    client?: SecretsManagerClient;

    /**
     * ARN or Names or the Secrets to fetch.
     */
    secrets: Record<string, string>;

    /**
     * Whether to throw an `Error` if a Secret could not be fetched.
     * Defaults to `true`.
     */
    throwOnError?: boolean;
}

export interface State<S> {
    secretsManager: SecretsManagerClient;
    secrets: S;
}

export const secretsManager = <S = {}>(config: Config): Middleware<Handler, State<S>> => ({
    id: 'secrets-manager',
    pure: true,
    init: async () => {
        // Either use the supplied Client or create one.
        const secretsManager = config.client ?? new SecretsManagerClient(config);

        // Fetch the individual Secrets.
        const keys = Object.keys(config.secrets);
        const secrets = keys.reduce<any>((obj, key) => {
            obj[key] = null;
            return obj;
        }, {});

        if (keys.length > 0) {
            try {
                const fetches = keys.map(key => secretsManager.send(new GetSecretValueCommand({ SecretId: config.secrets[key] })));

                (await Promise.all(fetches)).forEach(result => {
                    const { ARN, Name, SecretBinary, SecretString } = result;

                    const key = keys.find(instance => {
                        return (config.secrets[instance] === ARN ?? '') ||
                            (config.secrets[instance] === Name ?? '');
                    });

                    if (key) {
                        let value: unknown = null;

                        if (SecretString) {
                            if (SecretString.charAt(0) === '{' || SecretString.charAt(0) === '[') {
                                value = JSON.parse(SecretString);
                            } else {
                                value = SecretString;
                            }
                        } else if (SecretBinary) {
                            // TODO: Use-case?
                            // value = SecretBinary.toString();
                        }

                        secrets[key] = value;
                    }
                });
            } catch (e) {
                if (config.throwOnError !== false) {
                    throw new Error(`failed to fetch secrets: ${e}`);
                }
            }
        }

        return { secretsManager, secrets };
    },
});
